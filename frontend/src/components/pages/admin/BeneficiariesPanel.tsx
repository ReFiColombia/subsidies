import { getBuiltGraphSDK } from '@graphclient'
import { useQuery } from '@tanstack/react-query'
import { Check, Edit, Save, Search, Settings2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatUnits, isAddress } from 'viem'

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
    fechaAnadido: true,
    fechaEliminado: true,
    totalReclamado: true,
    acciones: true,
  })

  // Column width state
  const [columnWidths, setColumnWidths] = useState({
    nombre: 150,
    direccion: 130,
    telefono: 120,
    responsable: 120,
    activo: 80,
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
  const { data: beneficiariesData } = useBeneficiaries()

  // Create a lookup map for beneficiary data by address
  const beneficiaryLookup = useMemo(() => {
    if (!beneficiariesData) return new Map()
    return new Map(beneficiariesData.map((b) => [b.address.toLowerCase(), b]))
  }, [beneficiariesData])

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
        let aVal: any
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
  }, [data_beneficiaries?.beneficiaries, sortConfig, beneficiaryLookup])

  const filteredBeneficiaries = useMemo(() => {
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
    <div className="flex max-w-[90vw] flex-col items-center justify-center overflow-auto">
      <Card className="w-full rounded-xl border border-border bg-card p-0 shadow-md">
        <CardHeader className="mb-4 flex flex-col gap-2 border-b p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-card-foreground md:text-xl">
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
            <TabsList className="rounded-xl bg-muted p-1">
              <TabsTrigger
                value="resumen"
                className="tab-button rounded-lg px-4 transition-colors data-[state=active]:bg-primary data-[state=inactive]:bg-muted data-[state=active]:text-white data-[state=inactive]:text-muted-foreground"
              >
                Resumen
              </TabsTrigger>
              <TabsTrigger
                value="tabla"
                className="tab-button rounded-lg px-4 transition-colors data-[state=active]:bg-primary data-[state=inactive]:bg-muted data-[state=active]:text-white data-[state=inactive]:text-muted-foreground"
              >
                Tabla
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="w-full md:min-w-[650px]">
            {activeTab === 'resumen' && (
              <>
                <div className="mb-4 grid w-full grid-cols-1 gap-4 p-0 py-6 md:grid-cols-3">
                  <div className="flex h-full flex-col items-center justify-center rounded-lg border border-border bg-muted p-6 text-center shadow-sm">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                      Beneficiarios activos
                    </p>
                    <p className="text-xl font-bold text-card-foreground">
                      {sortedBeneficiaries.filter((b) => b.isActive).length}
                    </p>
                  </div>
                  <div className="flex h-full flex-col items-center justify-center rounded-lg border border-border bg-muted p-6 text-center shadow-sm">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                      Promedio reclamado por beneficiario
                    </p>
                    <p className="text-xl font-bold text-card-foreground">
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
                      cCOP
                    </p>
                  </div>
                  <div className="flex h-full flex-col items-center justify-center rounded-lg border border-border bg-muted p-6 text-center shadow-sm">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                      Intervalo de reclamo más común
                    </p>
                    <p className="text-xl font-bold text-card-foreground">
                      {mostCommonInterval !== null
                        ? `${mostCommonInterval} días`
                        : 'Cargando...'}
                    </p>
                  </div>
                </div>
                {/* Leaderboard */}
                <div className="w-full rounded-lg border border-border bg-muted p-4 shadow-sm">
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
                            <span className="text-sm font-bold">
                              {new Intl.NumberFormat('es-CO', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(
                                Number(formatUnits(b.totalClaimed, 18))
                              )}{' '}
                              cCOP
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
                  <div className="flex flex-1 items-center gap-2">
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
                      placeholder="Cantidad en COP"
                      value={amountThreshold}
                      onChange={(e) => setAmountThreshold(e.target.value)}
                      className="h-10 flex-1 border-2 border-primary bg-card font-medium text-brand-400 placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
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
                          { key: 'activo' as const, label: 'Activo' },
                          {
                            key: 'fechaAnadido' as const,
                            label: 'Fecha añadido',
                          },
                          {
                            key: 'fechaEliminado' as const,
                            label: 'Fecha eliminado',
                          },
                          {
                            key: 'totalReclamado' as const,
                            label: 'Total reclamado',
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
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative max-h-[65vh] w-full flex-1 overflow-x-auto overflow-y-auto">
                  <Table className="w-full min-w-[1000px]">
                    <TableHeader className="sticky top-0 z-10 rounded-t-xl bg-card shadow-sm">
                      <TableRow className="border-b-2 border-border">
                        {visibleColumns.acciones && (
                          <TableHead
                            className="relative"
                            style={{ width: `${columnWidths.acciones}px` }}
                          >
                            <div
                              className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                              onMouseDown={(e) =>
                                handleResizeStart(e, 'acciones')
                              }
                            />
                          </TableHead>
                        )}
                        {visibleColumns.nombre && (
                          <TableHead
                            onClick={() => requestSort('name')}
                            onContextMenu={(e) =>
                              handleContextMenu(e, 'nombre')
                            }
                            className="relative cursor-pointer font-bold"
                            style={{ width: `${columnWidths.nombre}px` }}
                          >
                            Nombre
                            <div
                              className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                              onMouseDown={(e) =>
                                handleResizeStart(e, 'nombre')
                              }
                            />
                          </TableHead>
                        )}
                        {visibleColumns.direccion && (
                          <TableHead
                            onClick={() => requestSort('id')}
                            onContextMenu={(e) =>
                              handleContextMenu(e, 'direccion')
                            }
                            className="relative cursor-pointer font-bold"
                            style={{ width: `${columnWidths.direccion}px` }}
                          >
                            Dir
                            <div
                              className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                              onMouseDown={(e) =>
                                handleResizeStart(e, 'direccion')
                              }
                            />
                          </TableHead>
                        )}
                        {visibleColumns.telefono && (
                          <TableHead
                            onClick={() => requestSort('phoneNumber')}
                            onContextMenu={(e) =>
                              handleContextMenu(e, 'telefono')
                            }
                            className="relative cursor-pointer font-bold"
                            style={{ width: `${columnWidths.telefono}px` }}
                          >
                            Tel
                            <div
                              className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                              onMouseDown={(e) =>
                                handleResizeStart(e, 'telefono')
                              }
                            />
                          </TableHead>
                        )}
                        {visibleColumns.responsable && (
                          <TableHead
                            onClick={() => requestSort('responsable')}
                            onContextMenu={(e) =>
                              handleContextMenu(e, 'responsable')
                            }
                            className="relative cursor-pointer font-bold"
                            style={{ width: `${columnWidths.responsable}px` }}
                          >
                            Resp
                            <div
                              className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                              onMouseDown={(e) =>
                                handleResizeStart(e, 'responsable')
                              }
                            />
                          </TableHead>
                        )}
                        {visibleColumns.activo && (
                          <TableHead
                            onClick={() => requestSort('isActive')}
                            onContextMenu={(e) =>
                              handleContextMenu(e, 'activo')
                            }
                            className="relative cursor-pointer font-bold"
                            style={{ width: `${columnWidths.activo}px` }}
                          >
                            Activo
                            <div
                              className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                              onMouseDown={(e) =>
                                handleResizeStart(e, 'activo')
                              }
                            />
                          </TableHead>
                        )}
                        {visibleColumns.fechaAnadido && (
                          <TableHead
                            onClick={() => requestSort('dateAdded')}
                            onContextMenu={(e) =>
                              handleContextMenu(e, 'fechaAnadido')
                            }
                            className="relative cursor-pointer font-bold"
                            style={{ width: `${columnWidths.fechaAnadido}px` }}
                          >
                            Fec. Añad.
                            <div
                              className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                              onMouseDown={(e) =>
                                handleResizeStart(e, 'fechaAnadido')
                              }
                            />
                          </TableHead>
                        )}
                        {visibleColumns.fechaEliminado && (
                          <TableHead
                            onClick={() => requestSort('dateRemoved')}
                            onContextMenu={(e) =>
                              handleContextMenu(e, 'fechaEliminado')
                            }
                            className="relative cursor-pointer font-bold"
                            style={{
                              width: `${columnWidths.fechaEliminado}px`,
                            }}
                          >
                            Fec. Elim.
                            <div
                              className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                              onMouseDown={(e) =>
                                handleResizeStart(e, 'fechaEliminado')
                              }
                            />
                          </TableHead>
                        )}
                        {visibleColumns.totalReclamado && (
                          <TableHead
                            onClick={() => requestSort('totalClaimed')}
                            onContextMenu={(e) =>
                              handleContextMenu(e, 'totalReclamado')
                            }
                            className="relative cursor-pointer text-right font-bold"
                            style={{
                              width: `${columnWidths.totalReclamado}px`,
                            }}
                          >
                            Total Reclamado
                            <div
                              className="absolute bottom-0 right-0 top-0 w-1 cursor-col-resize transition-colors hover:bg-primary"
                              onMouseDown={(e) =>
                                handleResizeStart(e, 'totalReclamado')
                              }
                            />
                          </TableHead>
                        )}
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
                            {visibleColumns.acciones && (
                              <TableCell
                                className="whitespace-nowrap p-1"
                                style={{ width: `${columnWidths.acciones}px` }}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRowClick(beneficiary.id)}
                                  className="h-6 w-6 p-0 transition-colors hover:bg-muted"
                                >
                                  <Edit className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </TableCell>
                            )}
                            {visibleColumns.nombre && (
                              <TableCell
                                className="cursor-pointer overflow-hidden text-ellipsis font-medium transition-colors hover:text-brand-400"
                                onClick={() => handleRowClick(beneficiary.id)}
                                style={{
                                  width: `${columnWidths.nombre}px`,
                                  maxWidth: `${columnWidths.nombre}px`,
                                }}
                                title={beneficiaryData?.name || '-'}
                              >
                                <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                  {beneficiaryData?.name || '-'}
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.direccion && (
                              <TableCell
                                className="cursor-pointer overflow-hidden transition-colors hover:text-brand-400"
                                onClick={() => {
                                  navigator.clipboard.writeText(beneficiary.id)
                                  toast({
                                    title: 'Dirección copiada al portapapeles',
                                  })
                                }}
                                style={{
                                  width: `${columnWidths.direccion}px`,
                                  maxWidth: `${columnWidths.direccion}px`,
                                }}
                                title={beneficiary.id}
                              >
                                <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                  {columnWidths.direccion < 100
                                    ? `${String(beneficiary.id).slice(0, 6)}...${String(beneficiary.id).slice(-4)}`
                                    : columnWidths.direccion < 150
                                      ? `${String(beneficiary.id).slice(0, 10)}...${String(beneficiary.id).slice(-8)}`
                                      : columnWidths.direccion < 200
                                        ? `${String(beneficiary.id).slice(0, 15)}...${String(beneficiary.id).slice(-10)}`
                                        : beneficiary.id}
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.telefono && (
                              <TableCell
                                className="overflow-hidden text-ellipsis"
                                style={{
                                  width: `${columnWidths.telefono}px`,
                                  maxWidth: `${columnWidths.telefono}px`,
                                }}
                                title={beneficiaryData?.phoneNumber || '-'}
                              >
                                <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                  {beneficiaryData?.phoneNumber || '-'}
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.responsable && (
                              <TableCell
                                className="overflow-hidden text-ellipsis"
                                style={{
                                  width: `${columnWidths.responsable}px`,
                                  maxWidth: `${columnWidths.responsable}px`,
                                }}
                                title={beneficiaryData?.responsable || '-'}
                              >
                                <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                  {beneficiaryData?.responsable || '-'}
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.activo && (
                              <TableCell
                                className="whitespace-nowrap"
                                style={{ width: `${columnWidths.activo}px` }}
                              >
                                {beneficiary.isActive ? 'Sí' : 'No'}
                              </TableCell>
                            )}
                            {visibleColumns.fechaAnadido && (
                              <TableCell
                                className="whitespace-nowrap"
                                style={{
                                  width: `${columnWidths.fechaAnadido}px`,
                                }}
                              >
                                {new Date(
                                  beneficiary.dateAdded * 1000
                                ).toLocaleDateString()}
                              </TableCell>
                            )}
                            {visibleColumns.fechaEliminado && (
                              <TableCell
                                className="whitespace-nowrap"
                                style={{
                                  width: `${columnWidths.fechaEliminado}px`,
                                }}
                              >
                                {beneficiary.dateRemoved
                                  ? new Date(
                                      beneficiary.dateRemoved * 1000
                                    ).toLocaleDateString()
                                  : '-'}
                              </TableCell>
                            )}
                            {visibleColumns.totalReclamado && (
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
                                    formatUnits(beneficiary.totalClaimed, 18)
                                  )
                                )}{' '}
                                cCOP
                              </TableCell>
                            )}
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
          <CardHeader className="border-b p-6">
            <CardTitle className="text-lg font-bold text-card-foreground md:text-xl">
              Buscar Beneficiario
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Ingresa la dirección del beneficiario para buscar y actualizar su
              información
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
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
            <CardHeader className="border-b p-6">
              <CardTitle className="text-lg font-bold text-card-foreground md:text-xl">
                Editar Beneficiario
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Dirección: {selectedAddress}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
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
