import { getReferralTag, submitReferral } from '@divvi/referral-sdk'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs'
import { Loader2, UserMinus,UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { isAddress } from 'viem'
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DIVVI_CONSUMER_ADDRESS,
  SUBSIDY_CONTRACT_ABI,
  SUBSIDY_CONTRACT_ADDRESS,
} from '@/constants'
import {
  useBeneficiary,
  useCreateBeneficiary,
  useUpdateBeneficiary,
} from '@/hooks/useBeneficiaries'
import { useToast } from '@/hooks/useToast'

import { adminTabsList, adminTabsTrigger } from './tabStyles'

export function BeneficiariesCard() {
  const { toast } = useToast()
  const { address: userAddress } = useAccount()
  const createBeneficiary = useCreateBeneficiary()
  const updateBeneficiary = useUpdateBeneficiary()

  // Step 1 is a single address field (same as remove). Step 2 is a dialog:
  // details for an add, a confirmation for a remove.
  const [addAddress, setAddAddress] = useState('')
  const [removeAddress, setRemoveAddress] = useState('')
  const [dialog, setDialog] = useState<null | 'add' | 'remove'>(null)
  const dialogAddress = (
    dialog === 'remove' ? removeAddress : addAddress
  ).trim()
  const validDialogAddress = isAddress(dialogAddress)
    ? (dialogAddress as `0x${string}`)
    : undefined

  // Existing record (a re-added beneficiary keeps its details) and on-chain status
  const { data: existingRecord, isFetching: loadingRecord } = useBeneficiary(
    dialog ? validDialogAddress : undefined
  )
  const { data: alreadyActive } = useReadContract({
    address: SUBSIDY_CONTRACT_ADDRESS as `0x${string}`,
    abi: SUBSIDY_CONTRACT_ABI,
    functionName: 'isBeneficiary',
    args: validDialogAddress ? [validDialogAddress] : undefined,
    query: { enabled: !!dialog && !!validDialogAddress },
  })

  // State for beneficiary form data
  const [beneficiaryData, setBeneficiaryData] = useState({
    address: '',
    name: '',
    phoneNumber: '',
    responsable: '',
  })

  // State to store pending beneficiary data for database insertion after blockchain success
  const [pendingDbData, setPendingDbData] = useState<{
    address: string
    name: string
    phoneNumber?: string
    responsable?: string
    exists?: boolean
  } | null>(null)

  // Función para generar enlace de Celoscan
  const getCeloscanUrl = (hash: string) => {
    return `https://celoscan.io/tx/${hash}`
  }

  const {
    writeContract,
    isPending,
    data: hash,
  } = useWriteContract({
    mutation: {
      onError: (error) => {
        console.error(error)
        toast({
          title: '❌ Error en la transacción',
          description: (
            <div className="space-y-2">
              <p className="text-sm">{error.message}</p>
              <p className="text-xs text-muted-foreground">
                Verifica que tengas permisos de administrador y suficiente gas.
              </p>
            </div>
          ),
          variant: 'destructive',
          duration: 10000,
        })
      },
    },
  })

  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

  const referralSuffix = () =>
    `0x${getReferralTag({
      user:
        (userAddress as `0x${string}`) ??
        '0x0000000000000000000000000000000000000000',
      consumer: DIVVI_CONSUMER_ADDRESS,
    })}` as `0x${string}`

  // Step 1: check the address, then open the dialog
  const openDialog =
    (kind: 'add' | 'remove') => (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault()
      const value = (kind === 'add' ? addAddress : removeAddress).trim()
      if (!isAddress(value)) {
        toast({ title: '¡Address inválida!', variant: 'destructive' })
        return
      }
      if (kind === 'add') {
        setBeneficiaryData({
          address: value,
          name: '',
          phoneNumber: '',
          responsable: '',
        })
      }
      setDialog(kind)
    }

  // Prefill the details when this address already has a record
  useEffect(() => {
    if (dialog === 'add' && existingRecord) {
      setBeneficiaryData((d) => ({
        ...d,
        name: d.name || existingRecord.name || '',
        phoneNumber: d.phoneNumber || existingRecord.phoneNumber || '',
        responsable: d.responsable || existingRecord.responsable || '',
      }))
    }
  }, [dialog, existingRecord])

  // Step 2 (add): sign the transaction, save details after it confirms
  const handleAddConfirm = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    const name = beneficiaryData.name.trim()
    if (!validDialogAddress) return
    if (!name) {
      toast({ title: 'El nombre es requerido', variant: 'destructive' })
      return
    }
    setPendingDbData({
      address: validDialogAddress,
      name,
      phoneNumber: beneficiaryData.phoneNumber.trim() || undefined,
      responsable: beneficiaryData.responsable.trim() || undefined,
      exists: !!existingRecord,
    })
    writeContract({
      abi: SUBSIDY_CONTRACT_ABI,
      address: SUBSIDY_CONTRACT_ADDRESS,
      functionName: 'addBeneficiary',
      args: [validDialogAddress],
      dataSuffix: referralSuffix(),
    })
  }

  // Step 2 (remove): sign the transaction
  const handleRemoveConfirm = () => {
    if (!validDialogAddress) return
    setPendingDbData(null)
    writeContract({
      abi: SUBSIDY_CONTRACT_ABI,
      address: SUBSIDY_CONTRACT_ADDRESS,
      functionName: 'removeBeneficiary',
      args: [validDialogAddress],
      dataSuffix: referralSuffix(),
    })
  }

  useEffect(() => {
    const handleSuccess = async () => {
      if (isSuccess && hash) {
        const celoscanUrl = getCeloscanUrl(hash)

        // Add to database after blockchain success
        if (pendingDbData) {
          try {
            const { exists, ...record } = pendingDbData
            if (exists) {
              await updateBeneficiary.mutateAsync(record)
            } else {
              await createBeneficiary.mutateAsync(record)
            }

            toast({
              title: '✅ ¡Operación completada exitosamente!',
              description: (
                <div className="space-y-2">
                  <p>Beneficiario agregado a la blockchain y base de datos.</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Hash:</span>
                    <a
                      href={celoscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-muted px-2 py-1 font-mono text-xs text-brand-400 transition-colors hover:bg-brand-800 hover:text-brand-300"
                    >
                      {hash.slice(0, 10)}...{hash.slice(-8)}
                    </a>
                  </div>
                </div>
              ),
              duration: 8000,
            })
          } catch (error) {
            console.error('Error saving to database:', error)
            toast({
              title:
                '⚠️ Beneficiario agregado a blockchain pero no a la base de datos',
              description: (
                <div className="space-y-2">
                  <p>
                    El beneficiario se agregó correctamente a la blockchain,
                    pero hubo un error al guardar en la base de datos. Por
                    favor, actualiza manualmente desde el panel de gestión.
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Hash:</span>
                    <a
                      href={celoscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-muted px-2 py-1 font-mono text-xs text-brand-400 transition-colors hover:bg-brand-800 hover:text-brand-300"
                    >
                      {hash.slice(0, 10)}...{hash.slice(-8)}
                    </a>
                  </div>
                </div>
              ),
              variant: 'destructive',
              duration: 12000,
            })
          }

          // Clear pending data
          setPendingDbData(null)
        } else {
          // No pending data (delete operation)
          toast({
            title: '✅ ¡Operación completada exitosamente!',
            description: (
              <div className="space-y-2">
                <p>La operación ha sido procesada correctamente.</p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Hash:</span>
                  <a
                    href={celoscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-muted px-2 py-1 font-mono text-xs text-brand-400 transition-colors hover:bg-brand-800 hover:text-brand-300"
                  >
                    {hash.slice(0, 10)}...{hash.slice(-8)}
                  </a>
                </div>
              </div>
            ),
            duration: 8000,
          })
        }

        // Report to Divvi
        submitReferral({ txHash: hash, chainId: 42220 }).catch((e) =>
          console.warn('Divvi submitReferral failed', e)
        )

        // Reset both steps after a successful transaction
        setDialog(null)
        setAddAddress('')
        setRemoveAddress('')
        setBeneficiaryData({
          address: '',
          name: '',
          phoneNumber: '',
          responsable: '',
        })
      }
    }

    handleSuccess()
  }, [isSuccess, hash, pendingDbData])

  const busy =
    isPending ||
    isLoading ||
    createBeneficiary.isPending ||
    updateBeneficiary.isPending
  const recordName = existingRecord?.name

  return (
    <>
      <Tabs defaultValue="add" className="h-full w-full flex-1">
        <TabsList className={adminTabsList}>
          <TabsTrigger value="add" className={adminTabsTrigger}>
            Añadir
          </TabsTrigger>
          <TabsTrigger value="delete" className={adminTabsTrigger}>
            Eliminar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="add">
          <Card className="w-full p-5 sm:p-6">
            <form onSubmit={openDialog('add')}>
              <CardHeader className="p-0 pb-5">
                <CardTitle className="text-xl text-card-foreground">
                  Añadir beneficiario
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pega la dirección. Después te pedimos nombre, teléfono y
                  responsable.
                </p>
              </CardHeader>
              <CardContent className="mb-4 p-0 text-left">
                <Label
                  htmlFor="address-add"
                  className="mb-2 text-muted-foreground"
                >
                  Address
                </Label>
                <Input
                  id="address-add"
                  placeholder="0x..."
                  autoComplete="off"
                  spellCheck={false}
                  className="mt-1 font-mono text-foreground"
                  value={addAddress}
                  onChange={(e) => setAddAddress(e.target.value)}
                />
              </CardContent>
              <CardFooter className="p-0">
                <Button type="submit" className="w-full" disabled={busy}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Continuar
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="delete">
          <Card className="w-full p-5 sm:p-6">
            <form onSubmit={openDialog('remove')}>
              <CardHeader className="p-0 pb-5">
                <CardTitle className="text-xl text-card-foreground">
                  Eliminar beneficiario
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pega la dirección. Te mostramos a quién vas a eliminar antes
                  de firmar.
                </p>
              </CardHeader>
              <CardContent className="mb-4 p-0 text-left">
                <Label
                  htmlFor="address-remove"
                  className="mb-2 text-muted-foreground"
                >
                  Address
                </Label>
                <Input
                  id="address-remove"
                  placeholder="0x..."
                  autoComplete="off"
                  spellCheck={false}
                  className="mt-1 font-mono text-foreground"
                  value={removeAddress}
                  onChange={(e) => setRemoveAddress(e.target.value)}
                />
              </CardContent>
              <CardFooter className="p-0">
                <Button type="submit" className="w-full" disabled={busy}>
                  <UserMinus className="mr-2 h-4 w-4" />
                  Continuar
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDialog(null)
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-[20px] border-[var(--line)] sm:max-w-md">
          {dialog === 'add' ? (
            <form onSubmit={handleAddConfirm} className="grid gap-4">
              <DialogHeader className="text-left">
                <DialogTitle className="font-display text-2xl">
                  Datos del beneficiario
                </DialogTitle>
                <DialogDescription>
                  Se guardan junto a la dirección cuando la transacción se
                  confirme.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border border-[var(--line)] bg-muted/40 px-3 py-2">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="break-all font-mono text-sm text-foreground">
                  {dialogAddress}
                </p>
              </div>
              {alreadyActive === true && (
                <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
                  Esta dirección ya es un beneficiario activo.
                </p>
              )}
              {existingRecord && (
                <p className="text-xs text-muted-foreground">
                  Ya había datos guardados para esta dirección; puedes
                  editarlos.
                </p>
              )}
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="ben-name" className="text-muted-foreground">
                    Nombre *
                  </Label>
                  <Input
                    id="ben-name"
                    autoFocus
                    required
                    placeholder={
                      loadingRecord ? 'Buscando…' : 'Nombre completo'
                    }
                    className="mt-1 text-foreground"
                    value={beneficiaryData.name}
                    onChange={(e) =>
                      setBeneficiaryData((d) => ({
                        ...d,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="ben-phone" className="text-muted-foreground">
                    Teléfono
                  </Label>
                  <Input
                    id="ben-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="Ej. 573001234567"
                    className="mt-1 text-foreground"
                    value={beneficiaryData.phoneNumber}
                    onChange={(e) =>
                      setBeneficiaryData((d) => ({
                        ...d,
                        phoneNumber: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="ben-resp" className="text-muted-foreground">
                    Responsable
                  </Label>
                  <Input
                    id="ben-resp"
                    placeholder="Nombre del responsable"
                    className="mt-1 text-foreground"
                    value={beneficiaryData.responsable}
                    onChange={(e) =>
                      setBeneficiaryData((d) => ({
                        ...d,
                        responsable: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setDialog(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={busy || alreadyActive === true}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {createBeneficiary.isPending || updateBeneficiary.isPending
                    ? 'Guardando datos…'
                    : isPending
                      ? 'Firma en tu wallet…'
                      : isLoading
                        ? 'Confirmando…'
                        : 'Añadir beneficiario'}
                </Button>
              </DialogFooter>
            </form>
          ) : dialog === 'remove' ? (
            <div className="grid gap-4">
              <DialogHeader className="text-left">
                <DialogTitle className="font-display text-2xl">
                  ¿Eliminar beneficiario?
                </DialogTitle>
                <DialogDescription>
                  Ya no podrá reclamar subsidios. Sus datos se conservan.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border border-[var(--line)] bg-muted/40 px-3 py-2">
                <p className="text-base font-medium text-foreground">
                  {loadingRecord
                    ? 'Buscando…'
                    : recordName || 'Sin nombre registrado'}
                </p>
                <p className="break-all font-mono text-sm text-muted-foreground">
                  {dialogAddress}
                </p>
              </div>
              {alreadyActive === false && (
                <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
                  Esta dirección no es un beneficiario activo.
                </p>
              )}
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setDialog(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy || alreadyActive === false}
                  onClick={handleRemoveConfirm}
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isPending
                    ? 'Firma en tu wallet…'
                    : isLoading
                      ? 'Confirmando…'
                      : 'Eliminar'}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
