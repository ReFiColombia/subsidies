import { getBuiltGraphSDK } from '@graphclient'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Edit,
  Save,
  Search,
  Settings2,
  X,
  XCircle,
} from 'lucide-react'
import {
  cloneElement,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { formatUnits, isAddress } from 'viem'
import { useReadContracts } from 'wagmi'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SUBSIDY_CONTRACT_ABI, SUBSIDY_CONTRACT_ADDRESS } from '@/constants'
import {
  useBeneficiaries,
  useBeneficiary,
  useCreateBeneficiary,
  useUpdateBeneficiary,
} from '@/hooks/useBeneficiaries'
import { useToast } from '@/hooks/useToast'

export function BeneficiariesPanel() {
  type beneficiary_fields =
    | 'id'
    | 'dateAdded'
    | 'dateRemoved'
    | 'isActive'
    | 'totalClaimed'
  type sortable_fields =
    | beneficiary_fields
    | 'name'
    | 'phoneNumber'
    | 'responsable'
    | 'lastClaimed'
  const { toast } = useToast()
  const [sortConfig, setSortConfig] = useState<{
    key: sortable_fields
    direction: 'asc' | 'desc'
  } | null>(null)
  const [activeTab, setActiveTab] = useState<'resumen' | 'tabla'>('resumen')

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  // Nuevo filtro de umbral
  const [amountThreshold, setAmountThreshold] = useState<string>('')
  const [amountComparison, setAmountComparison] = useState<'gt' | 'lt'>('gt')
  // Last claim filter: chips that can be combined (OR), plus a custom range
  const [lastClaimBuckets, setLastClaimBuckets] = useState<LastClaimBucket[]>(
    []
  )
  const [customRange, setCustomRange] = useState<{ from: string; to: string }>({
    from: '',
    to: '',
  })

  // Beneficiary management states
  const [searchAddress, setSearchAddress] = useState('')
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [dialogAddress, setDialogAddress] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    phoneNumber: string
    responsable: string
  }>({
    name: '',
    phoneNumber: '',
    responsable: '',
  })
  const [searchError, setSearchError] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    nombre: true,
    direccion: true,
    telefono: true,
    responsable: true,
    activo: true,
    ultimoReclamo: true,
    fechaAnadido: true,
    fechaEliminado: true,
    totalReclamado: true,
    acciones: true,
  })

  // Column width state
  const [columnWidths, setColumnWidths] = useState({
    nombre: 220,
    direccion: 140,
    telefono: 150,
    responsable: 190,
    activo: 44,
    ultimoReclamo: 130,
    fechaAnadido: 120,
    fechaEliminado: 120,
    totalReclamado: 150,
    acciones: 40,
  })

  // Resize state
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    column: keyof typeof visibleColumns
  } | null>(null)

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }))
    setContextMenu(null)
  }

  // Column order: drag a header onto another to move it. Saved per browser.
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(loadColumnOrder)
  const [dragColumn, setDragColumn] = useState<ColumnKey | null>(null)
  const [dropTarget, setDropTarget] = useState<ColumnKey | null>(null)
  const orderedColumns = columnOrder.filter((key) => visibleColumns[key])

  const moveColumn = (from: ColumnKey, to: ColumnKey) => {
    if (from === to) return
    setColumnOrder((prev) => {
      const next = prev.filter((k) => k !== from)
      next.splice(next.indexOf(to), 0, from)
      try {
        localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(next))
      } catch {
        // Storage can be blocked; the order still applies for this session
      }
      return next
    })
  }

  const resetColumnOrder = () => {
    setColumnOrder(DEFAULT_COLUMN_ORDER)
    try {
      localStorage.removeItem(COLUMN_ORDER_KEY)
    } catch {
      // ignore
    }
  }

  const columnDragProps = (key: ColumnKey) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      // Let the resize handle keep working
      if ((e.target as HTMLElement).dataset.resize) {
        e.preventDefault()
        return
      }
      setDragColumn(key)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', key)
    },
    onDragOver: (e: React.DragEvent) => {
      if (!dragColumn) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (dropTarget !== key) setDropTarget(key)
    },
    onDragLeave: () => setDropTarget((t) => (t === key ? null : t)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      if (dragColumn) moveColumn(dragColumn, key)
      setDragColumn(null)
      setDropTarget(null)
    },
    onDragEnd: () => {
      setDragColumn(null)
      setDropTarget(null)
    },
    'data-dragging': dragColumn === key ? '' : undefined,
    'data-drop-target':
      dropTarget === key && dragColumn !== key ? '' : undefined,
  })

  const handleContextMenu = (
    e: React.MouseEvent,
    column: keyof typeof visibleColumns
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, column })
  }

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu])

  const handleResizeStart = (
    e: React.MouseEvent,
    column: keyof typeof columnWidths
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(column)
    setResizeStartX(e.clientX)
    setResizeStartWidth(columnWidths[column])
  }

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingColumn) return
      const diff = e.clientX - resizeStartX
      const newWidth = Math.max(40, resizeStartWidth + diff)
      setColumnWidths((prev) => ({ ...prev, [resizingColumn]: newWidth }))
    },
    [resizingColumn, resizeStartX, resizeStartWidth]
  )

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null)
  }, [])

  // Add global event listeners for resize
  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd])

  const { data: selectedBeneficiary } = useBeneficiary(selectedAddress || '')
  const updateBeneficiary = useUpdateBeneficiary()
  const createBeneficiary = useCreateBeneficiary()

  const sdk = getBuiltGraphSDK()
  const result_beneficiaries = useQuery({
    queryKey: ['Beneficiaries'],
    queryFn: () => sdk.Beneficiaries(),
  })
  const { data: data_beneficiaries } = result_beneficiaries

  // Fetch beneficiary names from API
  const {
    data: beneficiariesData,
    error: beneficiariesError,
    refetch: refetchBeneficiaries,
    isFetching: isFetchingBeneficiaries,
  } = useBeneficiaries()

  // Create a lookup map for beneficiary data by address
  const beneficiaryLookup = useMemo(() => {
    if (!beneficiariesData) return new Map()
    return new Map(beneficiariesData.map((b) => [b.address.toLowerCase(), b]))
  }, [beneficiariesData])

  // Last claim per beneficiary, read from the contract (addressToUser).
  const beneficiaryIds = useMemo(
    () => data_beneficiaries?.beneficiaries.map((b) => b.id) ?? [],
    [data_beneficiaries?.beneficiaries]
  )
  const { data: lastClaimResults } = useReadContracts({
    contracts: beneficiaryIds.map((id) => ({
      address: SUBSIDY_CONTRACT_ADDRESS as `0x${string}`,
      abi: SUBSIDY_CONTRACT_ABI,
      functionName: 'addressToUser' as const,
      args: [id as `0x${string}`],
    })),
    query: { enabled: beneficiaryIds.length > 0, staleTime: 60_000 },
  })
  const lastClaimLookup = useMemo(() => {
    const map = new Map<string, number>()
    lastClaimResults?.forEach((r, i) => {
      if (r.status !== 'success') return
      const [lastClaimed] = r.result as readonly [bigint, bigint]
      map.set(beneficiaryIds[i].toLowerCase(), Number(lastClaimed))
    })
    return map
  }, [lastClaimResults, beneficiaryIds])

  // Fetch all DailyClaims (up to 1000 for safety)
  const result_dailyClaims = useQuery({
    queryKey: ['AllDailyClaims'],
    queryFn: () => sdk.DailyClaims(),
  })
  const { data: data_dailyClaims } = result_dailyClaims

  // Calculate most common claim interval in days
  const mostCommonInterval = useMemo(() => {
    if (!data_dailyClaims?.dailyClaims) return null
    const beneficiaryClaims: Record<string, number[]> = {}
    for (const dailyClaim of data_dailyClaims.dailyClaims) {
      if (!dailyClaim.beneficiaries) continue
      for (const beneficiary of dailyClaim.beneficiaries) {
        if (!beneficiaryClaims[beneficiary]) beneficiaryClaims[beneficiary] = []
        beneficiaryClaims[beneficiary].push(Number(dailyClaim.date))
      }
    }
    const intervals: number[] = []
    for (const dates of Object.values(beneficiaryClaims)) {
      if (dates.length < 2) continue
      dates.sort((a, b) => a - b)
      const interval = Math.round(
        (dates[dates.length - 1] - dates[0]) / (dates.length - 1) / 86400
      )
      if (interval > 0) intervals.push(interval)
    }
    if (intervals.length === 0) return null
    const freq: Record<number, number> = {}
    for (const interval of intervals) {
      freq[interval] = (freq[interval] || 0) + 1
    }
    return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0])
  }, [data_dailyClaims?.dailyClaims])

  const sortedBeneficiaries = useMemo(() => {
    if (!data_beneficiaries?.beneficiaries) return []
    const sorted = [...data_beneficiaries.beneficiaries]
    if (sortConfig !== null) {
      sorted.sort((a, b) => {
        // Mixed string, number and bigint values compared below
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let aVal: any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let bVal: any

        // Handle database fields (name, phoneNumber, responsable)
        if (
          sortConfig.key === 'name' ||
          sortConfig.key === 'phoneNumber' ||
          sortConfig.key === 'responsable'
        ) {
          const aData = beneficiaryLookup.get(a.id.toLowerCase())
          const bData = beneficiaryLookup.get(b.id.toLowerCase())
          aVal = aData?.[sortConfig.key] || ''
          bVal = bData?.[sortConfig.key] || ''
        } else if (sortConfig.key === 'lastClaimed') {
          aVal = lastClaimLookup.get(a.id.toLowerCase()) ?? -1
          bVal = lastClaimLookup.get(b.id.toLowerCase()) ?? -1
        } else {
          // Handle blockchain fields
          aVal = a[sortConfig.key as beneficiary_fields]
          bVal = b[sortConfig.key as beneficiary_fields]
        }

        if (sortConfig.key === 'totalClaimed') {
          aVal = BigInt(aVal || 0)
          bVal = BigInt(bVal || 0)
        }

        // Handle string comparison case-insensitively
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (aVal === bVal) return 0
        if (sortConfig.direction === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
    }
    return sorted
  }, [
    data_beneficiaries?.beneficiaries,
    sortConfig,
    beneficiaryLookup,
    lastClaimLookup,
  ])

  // Every filter except last claim; the chip counts are computed from this.
  const baseFilteredBeneficiaries = useMemo(() => {
    if (!sortedBeneficiaries) return []

    return sortedBeneficiaries.filter((beneficiary) => {
      // Search filter (address or name)
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const name = beneficiaryLookup.get(beneficiary.id.toLowerCase())?.name
        if (
          !beneficiary.id.toLowerCase().includes(q) &&
          !(name && name.toLowerCase().includes(q))
        ) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        const isActive = beneficiary.isActive
        if (statusFilter === 'active' && !isActive) return false
        if (statusFilter === 'inactive' && isActive) return false
      }

      // Date range filter
      if (dateRange.from || dateRange.to) {
        const addedDate = new Date(beneficiary.dateAdded * 1000)
        if (dateRange.from && addedDate < dateRange.from) return false
        if (dateRange.to && addedDate > dateRange.to) return false
      }

      // Filtro de umbral de monto reclamado
      if (amountThreshold !== '') {
        const claimed = Number(formatUnits(beneficiary.totalClaimed, 18))
        const threshold = Number(amountThreshold)
        if (amountComparison === 'gt' && !(claimed > threshold)) return false
        if (amountComparison === 'lt' && !(claimed < threshold)) return false
      }

      return true
    })
  }, [
    sortedBeneficiaries,
    searchQuery,
    statusFilter,
    dateRange,
    amountThreshold,
    amountComparison,
    beneficiaryLookup,
  ])

  // Days since each beneficiary's last claim: null = never, undefined = loading
  const claimDaysOf = useCallback(
    (id: string): number | null | undefined => {
      const last = lastClaimLookup.get(id.toLowerCase())
      if (last === undefined) return undefined
      return last === 0 ? null : daysSince(last)
    },
    [lastClaimLookup]
  )

  const lastClaimCounts = useMemo(() => {
    const counts: Record<LastClaimBucket, number> = {
      week: 0,
      month: 0,
      twoMonths: 0,
      older: 0,
      never: 0,
      custom: 0,
    }
    for (const b of baseFilteredBeneficiaries) {
      const days = claimDaysOf(b.id)
      if (days === undefined) continue
      for (const bucket of LAST_CLAIM_BUCKETS) {
        if (matchesBucket(bucket.id, days, customRange)) counts[bucket.id]++
      }
    }
    return counts
  }, [baseFilteredBeneficiaries, claimDaysOf, customRange])

  const filteredBeneficiaries = useMemo(() => {
    if (lastClaimBuckets.length === 0 || lastClaimLookup.size === 0)
      return baseFilteredBeneficiaries
    return baseFilteredBeneficiaries.filter((b) => {
      const days = claimDaysOf(b.id)
      if (days === undefined) return false
      return lastClaimBuckets.some((id) => matchesBucket(id, days, customRange))
    })
  }, [
    baseFilteredBeneficiaries,
    lastClaimBuckets,
    lastClaimLookup,
    claimDaysOf,
    customRange,
  ])

  const toggleLastClaimBucket = (id: LastClaimBucket) =>
    setLastClaimBuckets((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    )

  const requestSort = (key: sortable_fields) => {
    let direction: 'asc' | 'desc' = 'desc'
    if (sortConfig?.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'
    }
    setSortConfig({ key, direction })
  }

  const handleSearch = () => {
    setSearchError('')

    if (!searchAddress.trim()) {
      setSearchError('Por favor ingresa una dirección')
      return
    }

    if (!isAddress(searchAddress)) {
      setSearchError('Dirección inválida')
      return
    }

    const normalizedAddress = searchAddress.toLowerCase()
    const beneficiary = beneficiariesData?.find(
      (b) => b.address.toLowerCase() === normalizedAddress
    )

    if (!beneficiary) {
      setSearchError('Beneficiario no encontrado')
      setSelectedAddress(null)
      return
    }

    setSelectedAddress(beneficiary.address)
    setFormData({
      name: beneficiary.name,
      phoneNumber: beneficiary.phoneNumber || '',
      responsable: beneficiary.responsable || '',
    })
  }

  const handleUpdate = async () => {
    const addressToUpdate = dialogAddress || selectedAddress
    if (!addressToUpdate || !formData.name.trim()) return

    try {
      // Check if beneficiary exists in database
      const beneficiaryExists = beneficiaryLookup.has(
        addressToUpdate.toLowerCase()
      )

      if (beneficiaryExists) {
        // Update existing beneficiary
        await updateBeneficiary.mutateAsync({
          address: addressToUpdate,
          name: formData.name,
          phoneNumber: formData.phoneNumber || null,
          responsable: formData.responsable || null,
        })
        toast({ title: '✓ Beneficiario actualizado exitosamente' })
      } else {
        // Create new beneficiary record
        await createBeneficiary.mutateAsync({
          address: addressToUpdate,
          name: formData.name,
          phoneNumber: formData.phoneNumber || undefined,
          responsable: formData.responsable || undefined,
        })
        toast({ title: '✓ Información del beneficiario agregada exitosamente' })
      }

      // Clear form and close dialog after successful update/create
      setSearchAddress('')
      setSelectedAddress(null)
      setDialogAddress(null)
      setFormData({ name: '', phoneNumber: '', responsable: '' })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error updating beneficiary:', error)
      toast({
        title: 'Error al guardar la información del beneficiario',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = () => {
    setSearchAddress('')
    setSelectedAddress(null)
    setDialogAddress(null)
    setFormData({ name: '', phoneNumber: '', responsable: '' })
    setSearchError('')
    setIsDialogOpen(false)
  }

  const handleRowClick = (address: string) => {
    const beneficiary = beneficiaryLookup.get(address.toLowerCase())

    // Always open dialog, even if no database info exists
    setDialogAddress(address)
    setFormData({
      name: beneficiary?.name || '',
      phoneNumber: beneficiary?.phoneNumber || '',
      responsable: beneficiary?.responsable || '',
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="flex w-full min-w-0 flex-col items-center justify-center">
      <Card className="w-full p-0">
        <CardHeader className="mb-4 flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg text-card-foreground md:text-xl">
              Beneficiarios
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Consulta el listado de beneficiarios, su estado y estadísticas de
              participación.
            </CardDescription>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'resumen' | 'tabla')}
          >
            <TabsList className="inline-flex w-full rounded-full border border-[var(--line)] bg-muted/60 p-1 sm:w-auto">
              <TabsTrigger
                value="resumen"
                className="flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground sm:flex-none"
              >
                Resumen
              </TabsTrigger>
              <TabsTrigger
                value="tabla"
                className="flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground sm:flex-none"
              >
                Tabla
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="w-full">
            {beneficiariesError && (
              <div className="mb-4 flex flex-col gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p>
                    No se pudieron cargar los nombres, teléfonos y responsables.
                    <span className="block text-muted-foreground">
                      {beneficiariesError.message}
                    </span>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isFetchingBeneficiaries}
                  onClick={() => refetchBeneficiaries()}
                >
                  Reintentar
                </Button>
              </div>
            )}
            {activeTab === 'resumen' && (
              <>
                <div className="mb-4 grid w-full grid-cols-1 gap-3 p-0 py-6 sm:grid-cols-3 sm:gap-4">
                  <div className="flex h-full items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-muted/60 px-4 py-3 sm:flex-col sm:items-start sm:justify-center sm:gap-1 sm:px-5 sm:py-4">
                    <p className="text-sm font-medium text-muted-foreground sm:mb-1">
                      Beneficiarios activos
                    </p>
                    <p className="whitespace-nowrap text-base font-bold tabular-nums text-card-foreground sm:text-xl">
                      {sortedBeneficiaries.filter((b) => b.isActive).length}
                    </p>
                  </div>
                  <div className="flex h-full items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-muted/60 px-4 py-3 sm:flex-col sm:items-start sm:justify-center sm:gap-1 sm:px-5 sm:py-4">
                    <p className="text-sm font-medium text-muted-foreground sm:mb-1">
                      Promedio reclamado por beneficiario
                    </p>
                    <p className="whitespace-nowrap text-base font-bold tabular-nums text-card-foreground sm:text-xl">
                      {new Intl.NumberFormat('es-CO', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(
                        sortedBeneficiaries.length > 0
                          ? sortedBeneficiaries.reduce(
                              (acc, b) =>
                                acc + Number(formatUnits(b.totalClaimed, 18)),
                              0
                            ) / sortedBeneficiaries.length
                          : 0
                      )}{' '}
                      COPm
                    </p>
                  </div>
                  <div className="flex h-full items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-muted/60 px-4 py-3 sm:flex-col sm:items-start sm:justify-center sm:gap-1 sm:px-5 sm:py-4">
                    <p className="text-sm font-medium text-muted-foreground sm:mb-1">
                      Intervalo de reclamo más común
                    </p>
                    <p className="whitespace-nowrap text-base font-bold tabular-nums text-card-foreground sm:text-xl">
                      {mostCommonInterval !== null
                        ? `${mostCommonInterval} días`
                        : 'Cargando...'}
                    </p>
                  </div>
                </div>
                {/* Leaderboard */}
                <div className="w-full rounded-2xl border border-[var(--line)] bg-muted/60 p-4 sm:p-5">
                  <p className="mb-2 font-medium text-muted-foreground">
                    Top 5 beneficiarios por monto reclamado
                  </p>
                  <ol className="space-y-1">
                    {sortedBeneficiaries
                      .slice()
                      .sort((a, b) =>
                        Number(BigInt(b.totalClaimed) - BigInt(a.totalClaimed))
                      )
                      .slice(0, 5)
                      .map((b) => {
                        const beneficiaryData = beneficiaryLookup.get(
                          b.id.toLowerCase()
                        )
                        return (
                          <li
                            key={b.id}
                            className="flex items-center justify-between text-card-foreground"
                          >
                            <span
                              className="cursor-pointer text-sm hover:underline"
                              onClick={() => {
                                navigator.clipboard.writeText(b.id)
                                toast({
                                  title: 'Dirección copiada al portapapeles',
                                })
                              }}
                            >
                              {beneficiaryData?.name ||
                                `${String(b.id).slice(0, 7)}...${String(b.id).slice(-5)}`}
                            </span>
                            <span className="shrink-0 whitespace-nowrap text-sm font-bold">
                              {new Intl.NumberFormat('es-CO', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(
                                Number(formatUnits(b.totalClaimed, 18))
                              )}{' '}
                              COPm
                            </span>
                          </li>
                        )
                      })}
                  </ol>
                </div>
              </>
            )}
            {activeTab === 'tabla' && (
              <div className="w-full">
                {/* Primera línea de filtros */}
                <div className="mb-3 flex w-full flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-brand-400" />
                    <Input
                      placeholder="Buscar por nombre o dirección..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10 border-2 border-primary bg-card pl-10 font-medium text-brand-400 placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <DatePicker
                    date={dateRange.from}
                    onSelect={(date: Date | undefined) =>
                      setDateRange((prev) => ({ ...prev, from: date }))
                    }
                    placeholder="Desde"
                    disabled={{ after: new Date() }}
                    className="h-10 w-full md:w-[180px]"
                  />
                  <DatePicker
                    date={dateRange.to}
                    onSelect={(date: Date | undefined) =>
                      setDateRange((prev) => ({ ...prev, to: date }))
                    }
                    placeholder="Hasta"
                    disabled={{ after: new Date() }}
                    className="h-10 w-full md:w-[180px]"
                  />
                </div>

                {/* Segunda línea de filtros */}
                <div className="mb-4 flex w-full flex-col gap-3 md:flex-row">
                  {/* Filtro de Estado */}
                  <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as 'all' | 'active' | 'inactive')
                    }
                  >
                    <SelectTrigger className="h-10 w-full border-2 border-primary bg-card font-medium text-brand-400 hover:bg-muted focus:ring-primary md:w-[140px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="inactive">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filtro de umbral de monto reclamado */}
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <span className="whitespace-nowrap text-sm font-medium text-brand-400">
                      Monto:
                    </span>
                    <Select
                      value={amountComparison}
                      onValueChange={(v) =>
                        setAmountComparison(v as 'gt' | 'lt')
                      }
                    >
                      <SelectTrigger className="h-10 w-[140px] border-2 border-primary bg-card font-medium text-brand-400 hover:bg-muted focus:ring-primary">
                        <SelectValue>
                          {amountComparison === 'gt' ? 'Más de' : 'Menos de'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gt">Más de</SelectItem>
                        <SelectItem value="lt">Menos de</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      step="10000"
                      placeholder="Cantidad en COPm"
                      value={amountThreshold}
                      onChange={(e) => setAmountThreshold(e.target.value)}
                      className="h-10 min-w-[140px] flex-1 border-2 border-primary bg-card font-medium text-brand-400 placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                    />
                  </div>

                  {/* Column visibility toggle */}
                  <Select value="columns" onValueChange={() => {}}>
                    <SelectTrigger className="h-10 w-full border-2 border-primary font-medium text-brand-400 hover:bg-muted focus:ring-primary md:w-[160px]">
                      <Settings2 className="mr-2 h-4 w-4" />
                      <SelectValue>Columnas</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <div className="space-y-1 p-2">
                        {[
                          { key: 'nombre' as const, label: 'Nombre' },
                          { key: 'direccion' as const, label: 'Dirección' },
                          { key: 'telefono' as const, label: 'Teléfono' },
                          { key: 'responsable' as const, label: 'Responsable' },
                          { key: 'activo' as const, label: 'Estado' },
                          {
                            key: 'ultimoReclamo' as const,
                            label: 'Último reclamo',
                          },
                          {
                            key: 'fechaAnadido' as const,
                            label: 'Fecha añadido',
                          },
                          {
                            key: 'totalReclamado' as const,
                            label: 'Total reclamado',
                          },
                          {
                            key: 'fechaEliminado' as const,
                            label: 'Fecha eliminado',
                          },
                          { key: 'acciones' as const, label: 'Acciones' },
                        ].map((col) => (
                          <div
                            key={col.key}
                            className="flex cursor-pointer items-center space-x-2 rounded p-2 transition-colors hover:bg-muted"
                            onClick={() => toggleColumn(col.key)}
                          >
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                                visibleColumns[col.key]
                                  ? 'border-primary bg-primary'
                                  : 'border-border bg-card'
                              }`}
                            >
                              {visibleColumns[col.key] && (
                                <Check className="h-3 w-3 font-bold text-white" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">
                              {col.label}
                            </span>
                          </div>
                        ))}
                        <p className="px-2 pt-2 text-xs text-muted-foreground">
                          Arrastra los encabezados para cambiar el orden.
                        </p>
                        <button
                          type="button"
                          onClick={resetColumnOrder}
                          className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-sm text-brand-400 hover:bg-muted"
                        >
                          Restablecer orden
                        </button>
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                {/* Last claim filter: combinable chips with live counts */}
                <div className="mb-4 w-full rounded-2xl border border-[var(--line)] bg-muted/30 p-3 sm:p-4">
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="text-sm font-medium text-foreground">
                      Último reclamo
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Puedes combinar opciones, por ejemplo «Más de 60 días» +
                      «Nunca»
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setLastClaimBuckets([])}
                      aria-pressed={lastClaimBuckets.length === 0}
                      className={(() => {
                        const active = lastClaimBuckets.length === 0
                        return `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-[var(--line-strong)] text-muted-foreground hover:border-primary/60 hover:text-foreground'
                        }`
                      })()}
                    >
                      Todos
                      <span className="tabular-nums opacity-70">
                        {baseFilteredBeneficiaries.length}
                      </span>
                    </button>
                    {LAST_CLAIM_BUCKETS.map((bucket) => {
                      const active = lastClaimBuckets.includes(bucket.id)
                      return (
                        <button
                          key={bucket.id}
                          type="button"
                          onClick={() => toggleLastClaimBucket(bucket.id)}
                          aria-pressed={active}
                          title={bucket.hint}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            active
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-[var(--line-strong)] text-muted-foreground hover:border-primary/60 hover:text-foreground'
                          }`}
                        >
                          {bucket.label}
                          {bucket.id !== 'custom' && (
                            <span className="tabular-nums opacity-70">
                              {lastClaimLookup.size > 0
                                ? lastClaimCounts[bucket.id]
                                : '…'}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {lastClaimBuckets.includes('custom') && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        <span className="hidden sm:inline">Reclamó hace </span>
                        <span className="sm:hidden">Hace </span>
                        entre
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        placeholder="0"
                        aria-label="Desde días"
                        value={customRange.from}
                        onChange={(e) =>
                          setCustomRange((r) => ({
                            ...r,
                            from: e.target.value,
                          }))
                        }
                        className="h-9 w-16 bg-card text-center text-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span>y</span>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        placeholder="∞"
                        aria-label="Hasta días"
                        value={customRange.to}
                        onChange={(e) =>
                          setCustomRange((r) => ({ ...r, to: e.target.value }))
                        }
                        className="h-9 w-16 bg-card text-center text-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span>días</span>
                      <span className="tabular-nums text-foreground">
                        ({lastClaimCounts.custom})
                      </span>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Mostrando{' '}
                    <span className="font-medium text-foreground">
                      {filteredBeneficiaries.length}
                    </span>{' '}
                    de {sortedBeneficiaries.length} beneficiarios
                  </p>
                </div>

                {/* Phones: one card per beneficiary, nothing cut off */}
                <ul className="space-y-3 md:hidden">
                  {filteredBeneficiaries.length === 0 && (
                    <li className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
                      No hay beneficiarios con estos filtros.
                    </li>
                  )}
                  {filteredBeneficiaries.map((beneficiary) => {
                    const info = beneficiaryLookup.get(
                      beneficiary.id.toLowerCase()
                    )
                    return (
                      <li
                        key={beneficiary.id}
                        className="rounded-lg border border-border bg-muted/40 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words font-semibold">
                              {info?.name || 'Sin nombre registrado'}
                            </p>
                            <button
                              type="button"
                              className="mt-1 break-all text-left font-mono text-xs text-muted-foreground"
                              onClick={() => {
                                navigator.clipboard.writeText(beneficiary.id)
                                toast({
                                  title: 'Dirección copiada al portapapeles',
                                })
                              }}
                            >
                              {beneficiary.id}
                            </button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRowClick(beneficiary.id)}
                            className="h-8 w-8 shrink-0 p-0"
                            aria-label="Editar"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                          <dt className="text-muted-foreground">Teléfono</dt>
                          <dd className="break-words">
                            {info?.phoneNumber ? (
                              <a
                                href={`tel:${info.phoneNumber.replace(/\s/g, '')}`}
                              >
                                {info.phoneNumber}
                              </a>
                            ) : (
                              '-'
                            )}
                          </dd>
                          <dt className="text-muted-foreground">Responsable</dt>
                          <dd className="break-words">
                            {info?.responsable || '-'}
                          </dd>
                          <dt className="text-muted-foreground">Estado</dt>
                          <dd>
                            {beneficiary.isActive ? 'Activo' : 'Inactivo'}
                          </dd>
                          <dt className="text-muted-foreground">
                            Último reclamo
                          </dt>
                          <dd>
                            <LastClaim
                              seconds={lastClaimLookup.get(
                                beneficiary.id.toLowerCase()
                              )}
                            />
                          </dd>
                          <dt className="text-muted-foreground">Añadido</dt>
                          <dd>
                            {new Date(
                              beneficiary.dateAdded * 1000
                            ).toLocaleDateString('es-CO')}
                          </dd>
                          {beneficiary.dateRemoved && (
                            <>
                              <dt className="text-muted-foreground">
                                Eliminado
                              </dt>
                              <dd>
                                {new Date(
                                  beneficiary.dateRemoved * 1000
                                ).toLocaleDateString('es-CO')}
                              </dd>
                            </>
                          )}
                          <dt className="text-muted-foreground">Reclamado</dt>
                          <dd className="font-semibold">
                            {new Intl.NumberFormat('es-CO', {
                              maximumFractionDigits: 0,
                            }).format(
                              Number(formatUnits(beneficiary.totalClaimed, 18))
                            )}{' '}
                            COPm
                          </dd>
                        </dl>
                      </li>
                    )
                  })}
                </ul>

                {/* Tablets and up: the full table, scrolls sideways inside the card */}
                <div className="relative hidden max-h-[65vh] w-full flex-1 overflow-x-auto overflow-y-auto md:block">
                  <Table className="w-full min-w-[1220px]">
                    <TableHeader className="sticky top-0 z-10 rounded-t-xl bg-card shadow-sm">
                      <TableRow className="border-b-2 border-border [&>th:active]:cursor-grabbing [&>th[data-dragging]]:opacity-40 [&>th[data-drop-target]]:shadow-[inset_2px_0_0_0_hsl(var(--primary))] [&>th]:cursor-grab [&>th]:select-none">
                        {(() => {
                          const heads: Record<ColumnKey, React.ReactElement> = {
                            acciones: (
                              <TableHead
                                className="relative"
                                style={{ width: `${columnWidths.acciones}px` }}
                              >
                                <div
                                  data-resize="1"
                                  className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                                  onMouseDown={(e) =>
                                    handleResizeStart(e, 'acciones')
                                  }
                                />
                              </TableHead>
                            ),
                            nombre: (
                              <TableHead
                                onClick={() => requestSort('name')}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, 'nombre')
                                }
                                className="relative cursor-pointer whitespace-nowrap font-bold"
                                style={{ width: `${columnWidths.nombre}px` }}
                              >
                                Nombre
                                <div
                                  data-resize="1"
                                  className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                                  onMouseDown={(e) =>
                                    handleResizeStart(e, 'nombre')
                                  }
                                />
                              </TableHead>
                            ),
                            direccion: (
                              <TableHead
                                onClick={() => requestSort('id')}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, 'direccion')
                                }
                                className="relative cursor-pointer whitespace-nowrap font-bold"
                                style={{ width: `${columnWidths.direccion}px` }}
                              >
                                Dirección
                                <div
                                  data-resize="1"
                                  className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                                  onMouseDown={(e) =>
                                    handleResizeStart(e, 'direccion')
                                  }
                                />
                              </TableHead>
                            ),
                            telefono: (
                              <TableHead
                                onClick={() => requestSort('phoneNumber')}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, 'telefono')
                                }
                                className="relative cursor-pointer whitespace-nowrap font-bold"
                                style={{ width: `${columnWidths.telefono}px` }}
                              >
                                Teléfono
                                <div
                                  data-resize="1"
                                  className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                                  onMouseDown={(e) =>
                                    handleResizeStart(e, 'telefono')
                                  }
                                />
                              </TableHead>
                            ),
                            responsable: (
                              <TableHead
                                onClick={() => requestSort('responsable')}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, 'responsable')
                                }
                                className="relative cursor-pointer whitespace-nowrap font-bold"
                                style={{
                                  width: `${columnWidths.responsable}px`,
                                }}
                              >
                                Responsable
                                <div
                                  data-resize="1"
                                  className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                                  onMouseDown={(e) =>
                                    handleResizeStart(e, 'responsable')
                                  }
                                />
                              </TableHead>
                            ),
                            activo: (
                              <TableHead
                                onClick={() => requestSort('isActive')}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, 'activo')
                                }
                                className="relative cursor-pointer px-2 text-center"
                                style={{ width: `${columnWidths.activo}px` }}
                                title="Estado (activo o inactivo)"
                              >
                                <span className="sr-only">Estado</span>
                              </TableHead>
                            ),
                            ultimoReclamo: (
                              <TableHead
                                onClick={() => requestSort('lastClaimed')}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, 'ultimoReclamo')
                                }
                                className="relative cursor-pointer whitespace-nowrap font-bold"
                                style={{
                                  width: `${columnWidths.ultimoReclamo}px`,
                                }}
                              >
                                Último reclamo
                                <div
                                  data-resize="1"
                                  className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                                  onMouseDown={(e) =>
                                    handleResizeStart(e, 'ultimoReclamo')
                                  }
                                />
                              </TableHead>
                            ),
                            fechaAnadido: (
                              <TableHead
                                onClick={() => requestSort('dateAdded')}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, 'fechaAnadido')
                                }
                                className="relative cursor-pointer whitespace-nowrap font-bold"
                                style={{
                                  width: `${columnWidths.fechaAnadido}px`,
                                }}
                              >
                                Añadido
                                <div
                                  data-resize="1"
                                  className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                                  onMouseDown={(e) =>
                                    handleResizeStart(e, 'fechaAnadido')
                                  }
                                />
                              </TableHead>
                            ),
                            totalReclamado: (
                              <TableHead
                                onClick={() => requestSort('totalClaimed')}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, 'totalReclamado')
                                }
                                className="relative cursor-pointer whitespace-nowrap text-right font-bold"
                                style={{
                                  width: `${columnWidths.totalReclamado}px`,
                                }}
                              >
                                Total Reclamado
                                <div
                                  data-resize="1"
                                  className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                                  onMouseDown={(e) =>
                                    handleResizeStart(e, 'totalReclamado')
                                  }
                                />
                              </TableHead>
                            ),
                            fechaEliminado: (
                              <TableHead
                                onClick={() => requestSort('dateRemoved')}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, 'fechaEliminado')
                                }
                                className="relative cursor-pointer whitespace-nowrap font-bold"
                                style={{
                                  width: `${columnWidths.fechaEliminado}px`,
                                }}
                              >
                                Eliminado
                                <div
                                  data-resize="1"
                                  className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                                  onMouseDown={(e) =>
                                    handleResizeStart(e, 'fechaEliminado')
                                  }
                                />
                              </TableHead>
                            ),
                          }
                          return orderedColumns.map((key) =>
                            cloneElement(heads[key], {
                              key,
                              ...columnDragProps(key),
                            })
                          )
                        })()}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-left">
                      {filteredBeneficiaries.map((beneficiary) => {
                        const beneficiaryData = beneficiaryLookup.get(
                          beneficiary.id.toLowerCase()
                        )
                        return (
                          <TableRow
                            key={beneficiary.id}
                            className="transition-colors hover:bg-muted"
                          >
                            {(() => {
                              const cells: Record<
                                ColumnKey,
                                React.ReactElement
                              > = {
                                acciones: (
                                  <TableCell
                                    className="whitespace-nowrap p-1"
                                    style={{
                                      width: `${columnWidths.acciones}px`,
                                    }}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleRowClick(beneficiary.id)
                                      }
                                      className="h-6 w-6 p-0 transition-colors hover:bg-muted"
                                    >
                                      <Edit className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                  </TableCell>
                                ),
                                nombre: (
                                  <TableCell
                                    className="cursor-pointer font-medium transition-colors hover:text-brand-400"
                                    onClick={() =>
                                      handleRowClick(beneficiary.id)
                                    }
                                    style={{
                                      minWidth: `${columnWidths.nombre}px`,
                                    }}
                                    title={beneficiaryData?.name || '-'}
                                  >
                                    <div className="whitespace-normal break-words">
                                      {beneficiaryData?.name || '-'}
                                    </div>
                                  </TableCell>
                                ),
                                direccion: (
                                  <TableCell
                                    className="cursor-pointer overflow-hidden transition-colors hover:text-brand-400"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        beneficiary.id
                                      )
                                      toast({
                                        title:
                                          'Dirección copiada al portapapeles',
                                      })
                                    }}
                                    style={{
                                      width: `${columnWidths.direccion}px`,
                                      maxWidth: `${columnWidths.direccion}px`,
                                    }}
                                    title={beneficiary.id}
                                  >
                                    <MiddleTruncate value={beneficiary.id} />
                                  </TableCell>
                                ),
                                telefono: (
                                  <TableCell
                                    style={{
                                      minWidth: `${columnWidths.telefono}px`,
                                    }}
                                    title={beneficiaryData?.phoneNumber || '-'}
                                  >
                                    <div className="whitespace-nowrap">
                                      {beneficiaryData?.phoneNumber || '-'}
                                    </div>
                                  </TableCell>
                                ),
                                responsable: (
                                  <TableCell
                                    style={{
                                      minWidth: `${columnWidths.responsable}px`,
                                    }}
                                    title={beneficiaryData?.responsable || '-'}
                                  >
                                    <div className="whitespace-normal break-words">
                                      {beneficiaryData?.responsable || '-'}
                                    </div>
                                  </TableCell>
                                ),
                                activo: (
                                  <TableCell
                                    className="px-2 text-center"
                                    style={{
                                      width: `${columnWidths.activo}px`,
                                    }}
                                    title={
                                      beneficiary.isActive
                                        ? 'Activo'
                                        : 'Inactivo'
                                    }
                                  >
                                    {beneficiary.isActive ? (
                                      <CheckCircle2
                                        className="mx-auto h-5 w-5 text-emerald-400"
                                        aria-label="Activo"
                                      />
                                    ) : (
                                      <XCircle
                                        className="mx-auto h-5 w-5 text-red-400"
                                        aria-label="Inactivo"
                                      />
                                    )}
                                  </TableCell>
                                ),
                                ultimoReclamo: (
                                  <TableCell
                                    className="whitespace-nowrap"
                                    style={{
                                      width: `${columnWidths.ultimoReclamo}px`,
                                    }}
                                  >
                                    <LastClaim
                                      seconds={lastClaimLookup.get(
                                        beneficiary.id.toLowerCase()
                                      )}
                                    />
                                  </TableCell>
                                ),
                                fechaAnadido: (
                                  <TableCell
                                    className="whitespace-nowrap"
                                    style={{
                                      width: `${columnWidths.fechaAnadido}px`,
                                    }}
                                  >
                                    {new Date(
                                      beneficiary.dateAdded * 1000
                                    ).toLocaleDateString('es-CO')}
                                  </TableCell>
                                ),
                                totalReclamado: (
                                  <TableCell
                                    className="whitespace-nowrap text-right"
                                    style={{
                                      width: `${columnWidths.totalReclamado}px`,
                                    }}
                                  >
                                    {new Intl.NumberFormat('es-CO', {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    }).format(
                                      Number(
                                        formatUnits(
                                          beneficiary.totalClaimed,
                                          18
                                        )
                                      )
                                    )}{' '}
                                    COPm
                                  </TableCell>
                                ),
                                fechaEliminado: (
                                  <TableCell
                                    className="whitespace-nowrap"
                                    style={{
                                      width: `${columnWidths.fechaEliminado}px`,
                                    }}
                                  >
                                    {beneficiary.dateRemoved
                                      ? new Date(
                                          beneficiary.dateRemoved * 1000
                                        ).toLocaleDateString('es-CO')
                                      : '-'}
                                  </TableCell>
                                ),
                              }
                              return orderedColumns.map((key) => (
                                <Fragment key={key}>{cells[key]}</Fragment>
                              ))
                            })()}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Beneficiary Management Section */}
      <div className="mt-6 w-full space-y-4">
        <Card className="w-full rounded-xl border border-border bg-card shadow-md">
          <CardHeader className="border-b border-[var(--line)] p-4 sm:p-6">
            <CardTitle className="text-lg text-card-foreground md:text-xl">
              Buscar Beneficiario
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Ingresa la dirección del beneficiario para buscar y actualizar su
              información
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="0x..."
                  value={searchAddress}
                  onChange={(e) => {
                    setSearchAddress(e.target.value)
                    setSearchError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                  className="border-border text-foreground"
                />
                {searchError && (
                  <p className="mt-1 text-sm text-red-500">{searchError}</p>
                )}
              </div>
              <Button
                onClick={handleSearch}
                disabled={!searchAddress.trim()}
                className="bg-primary text-white hover:bg-brand-700"
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedAddress && selectedBeneficiary && (
          <Card className="w-full rounded-xl border border-border bg-card shadow-md">
            <CardHeader className="border-b border-[var(--line)] p-4 sm:p-6">
              <CardTitle className="text-lg text-card-foreground md:text-xl">
                Editar Beneficiario
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Dirección: {selectedAddress}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nombre completo"
                    className="mt-1 border-border text-foreground"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="phoneNumber"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Teléfono
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="Número de teléfono"
                    className="mt-1 border-border text-foreground"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="responsable"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Responsable
                  </Label>
                  <Input
                    id="responsable"
                    value={formData.responsable}
                    onChange={(e) =>
                      setFormData({ ...formData, responsable: e.target.value })
                    }
                    placeholder="Nombre del responsable"
                    className="mt-1 border-border text-foreground"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleUpdate}
                    disabled={
                      updateBeneficiary.isPending || !formData.name.trim()
                    }
                    className="flex-1 bg-primary text-white hover:bg-brand-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateBeneficiary.isPending ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={updateBeneficiary.isPending}
                    className="border-border text-muted-foreground hover:bg-muted"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              Editar Beneficiario
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {dialogAddress && `Dirección: ${dialogAddress}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label
                htmlFor="dialog-name"
                className="text-sm font-medium text-muted-foreground"
              >
                Nombre
              </Label>
              <Input
                id="dialog-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre completo"
                className="mt-1 border-border text-foreground"
              />
            </div>

            <div>
              <Label
                htmlFor="dialog-phoneNumber"
                className="text-sm font-medium text-muted-foreground"
              >
                Teléfono
              </Label>
              <Input
                id="dialog-phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="Número de teléfono"
                className="mt-1 border-border text-foreground"
              />
            </div>

            <div>
              <Label
                htmlFor="dialog-responsable"
                className="text-sm font-medium text-muted-foreground"
              >
                Responsable
              </Label>
              <Input
                id="dialog-responsable"
                value={formData.responsable}
                onChange={(e) =>
                  setFormData({ ...formData, responsable: e.target.value })
                }
                placeholder="Nombre del responsable"
                className="mt-1 border-border text-foreground"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleUpdate}
                disabled={updateBeneficiary.isPending || !formData.name.trim()}
                className="flex-1 bg-primary text-white hover:bg-brand-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateBeneficiary.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={updateBeneficiary.isPending}
                className="border-border text-muted-foreground hover:bg-muted"
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 rounded-lg border border-border bg-card py-1 shadow-lg"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
            onClick={() => toggleColumn(contextMenu.column)}
          >
            <X className="h-4 w-4" />
            Ocultar columna
          </button>
        </div>
      )}
    </div>
  )
}

type LastClaimBucket =
  | 'week'
  | 'month'
  | 'twoMonths'
  | 'older'
  | 'never'
  | 'custom'

const LAST_CLAIM_BUCKETS: {
  id: LastClaimBucket
  label: string
  hint: string
}[] = [
  { id: 'week', label: 'Últimos 7 días', hint: 'Reclamó hace 0 a 7 días' },
  { id: 'month', label: '8 a 30 días', hint: 'Reclamó hace 8 a 30 días' },
  { id: 'twoMonths', label: '31 a 60 días', hint: 'Reclamó hace 31 a 60 días' },
  { id: 'older', label: 'Más de 60 días', hint: 'Reclamó hace más de 60 días' },
  { id: 'never', label: 'Nunca', hint: 'Nunca ha reclamado' },
  {
    id: 'custom',
    label: 'Rango personalizado',
    hint: 'Elige entre X y Y días',
  },
]

// days: days since the last claim, or null when the beneficiary never claimed
function matchesBucket(
  bucket: LastClaimBucket,
  days: number | null,
  custom: { from: string; to: string }
): boolean {
  if (bucket === 'never') return days === null
  if (days === null) return false
  switch (bucket) {
    case 'week':
      return days <= 7
    case 'month':
      return days >= 8 && days <= 30
    case 'twoMonths':
      return days >= 31 && days <= 60
    case 'older':
      return days > 60
    case 'custom': {
      const from = custom.from === '' ? 0 : Number(custom.from)
      const to = custom.to === '' ? Infinity : Number(custom.to)
      return days >= Math.min(from, to) && days <= Math.max(from, to)
    }
  }
}

type ColumnKey =
  | 'activo'
  | 'acciones'
  | 'nombre'
  | 'direccion'
  | 'telefono'
  | 'responsable'
  | 'ultimoReclamo'
  | 'fechaAnadido'
  | 'totalReclamado'
  | 'fechaEliminado'

const DEFAULT_COLUMN_ORDER: ColumnKey[] = [
  'activo',
  'acciones',
  'nombre',
  'direccion',
  'telefono',
  'responsable',
  'ultimoReclamo',
  'fechaAnadido',
  'totalReclamado',
  'fechaEliminado',
]

const COLUMN_ORDER_KEY = 'subsidies.admin.beneficiaries.columnOrder'

// Saved order, keeping only known columns and adding any new ones at the end
function loadColumnOrder(): ColumnKey[] {
  try {
    const saved = JSON.parse(
      localStorage.getItem(COLUMN_ORDER_KEY) ?? 'null'
    ) as unknown
    if (!Array.isArray(saved)) return DEFAULT_COLUMN_ORDER
    const known = saved.filter((k): k is ColumnKey =>
      DEFAULT_COLUMN_ORDER.includes(k as ColumnKey)
    )
    return [...known, ...DEFAULT_COLUMN_ORDER.filter((k) => !known.includes(k))]
  } catch {
    return DEFAULT_COLUMN_ORDER
  }
}

// Address cut in the middle with the same number of characters on each side
// (0x3f…45f), sized to whatever width the column has. Monospace makes every
// character the same width, so one measurement is enough.
function MiddleTruncate({ value }: { value: string }) {
  const [box, setBox] = useState<HTMLSpanElement | null>(null)
  const [side, setSide] = useState<number | null>(null)

  useEffect(() => {
    if (!box) return
    const probe = document.createElement('span')
    probe.textContent = '0'.repeat(10)
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre'
    box.appendChild(probe)
    const charWidth = probe.getBoundingClientRect().width / 10
    box.removeChild(probe)

    const update = () => {
      const width = box.clientWidth
      if (!charWidth || width >= charWidth * value.length) {
        setSide(null)
        return
      }
      // One character's worth of room for the ellipsis
      const n = Math.floor((width / charWidth - 1) / 2)
      setSide(Math.max(1, n))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(box)
    return () => observer.disconnect()
  }, [box, value])

  return (
    <span
      ref={setBox}
      className="block w-full overflow-hidden whitespace-nowrap font-mono text-sm"
      aria-label={value}
    >
      {side === null ? value : `${value.slice(0, side)}…${value.slice(-side)}`}
    </span>
  )
}

// Calendar days between a unix timestamp and today, in local time.
function daysSince(seconds: number): number {
  const day = new Date(seconds * 1000)
  day.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((today.getTime() - day.getTime()) / 86400000)
}

// Date of a beneficiary's last claim plus how long ago it was.
function LastClaim({ seconds }: { seconds: number | undefined }) {
  if (seconds === undefined)
    return <span className="text-muted-foreground">...</span>
  if (seconds === 0) return <span className="text-muted-foreground">Nunca</span>
  const days = daysSince(seconds)
  const ago =
    days <= 0 ? 'hoy' : days === 1 ? 'hace 1 día' : `hace ${days} días`
  return (
    <span title={new Date(seconds * 1000).toLocaleString('es-CO')}>
      {new Date(seconds * 1000).toLocaleDateString('es-CO')}
      <span className="block text-xs text-muted-foreground">{ago}</span>
    </span>
  )
}
