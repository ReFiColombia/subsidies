import { getReferralTag, submitReferral } from '@divvi/referral-sdk'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { isAddress } from 'viem'
import {
  useAccount,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DIVVI_CONSUMER_ADDRESS,
  SUBSIDY_CONTRACT_ABI,
  SUBSIDY_CONTRACT_ADDRESS,
} from '@/constants'
import { useCreateBeneficiary } from '@/hooks/useBeneficiaries'
import { useToast } from '@/hooks/useToast'

export function BeneficiariesCard() {
  const { toast } = useToast()
  const { address: userAddress } = useAccount()
  const createBeneficiary = useCreateBeneficiary()

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

  const handleAddSubmit = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()

    const formData = new FormData(evt.currentTarget)
    const address = formData.get('address')?.toString().trim() ?? ''
    const name = formData.get('name')?.toString().trim() ?? ''
    const phoneNumber = formData.get('phoneNumber')?.toString().trim() ?? ''
    const responsable = formData.get('responsable')?.toString().trim() ?? ''

    if (!isAddress(address)) {
      toast({
        title: '¡Address inválida!',
        variant: 'destructive',
      })
      return
    }

    if (!name) {
      toast({
        title: 'El nombre es requerido',
        variant: 'destructive',
      })
      return
    }

    // Store data to be added to database after blockchain success
    setPendingDbData({
      address,
      name,
      phoneNumber: phoneNumber || undefined,
      responsable: responsable || undefined,
    })

    // Add to blockchain first
    const referralTag = getReferralTag({
      user:
        (userAddress as `0x${string}`) ??
        '0x0000000000000000000000000000000000000000',
      consumer: DIVVI_CONSUMER_ADDRESS,
    })

    writeContract({
      abi: SUBSIDY_CONTRACT_ABI,
      address: SUBSIDY_CONTRACT_ADDRESS,
      functionName: 'addBeneficiary',
      args: [address],
      dataSuffix: `0x${referralTag}`,
    })
  }

  const handleDeleteSubmit = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()

    const formData = new FormData(evt.currentTarget)
    const address = formData.get('address')?.toString().trim() ?? ''

    if (!isAddress(address)) {
      toast({
        title: '¡Address inválida!',
        variant: 'destructive',
      })
      return
    }

    const referralTag = getReferralTag({
      user:
        (userAddress as `0x${string}`) ??
        '0x0000000000000000000000000000000000000000',
      consumer: DIVVI_CONSUMER_ADDRESS,
    })

    writeContract({
      abi: SUBSIDY_CONTRACT_ABI,
      address: SUBSIDY_CONTRACT_ADDRESS,
      functionName: 'removeBeneficiary',
      args: [address],
      dataSuffix: `0x${referralTag}`,
    })
  }

  useEffect(() => {
    const handleSuccess = async () => {
      if (isSuccess && hash) {
        const celoscanUrl = getCeloscanUrl(hash)

        // Add to database after blockchain success
        if (pendingDbData) {
          try {
            await createBeneficiary.mutateAsync(pendingDbData)

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

        // Reset form after successful transaction
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

  return (
    <Tabs defaultValue="add" className="h-full w-full flex-1">
      <TabsList className="mb-4 grid w-full grid-cols-2 gap-x-2 rounded-xl bg-muted p-1">
        <TabsTrigger
          value="add"
          className="tab-button rounded-lg transition-colors data-[state=active]:bg-primary data-[state=inactive]:bg-muted data-[state=active]:text-white data-[state=inactive]:text-muted-foreground"
        >
          Añadir
        </TabsTrigger>
        <TabsTrigger
          value="delete"
          className="tab-button rounded-lg transition-colors data-[state=active]:bg-primary data-[state=inactive]:bg-muted data-[state=active]:text-white data-[state=inactive]:text-muted-foreground"
        >
          Eliminar
        </TabsTrigger>
      </TabsList>
      <TabsContent value="add">
        <Card className="mx-auto mb-6 w-full max-w-[400px] rounded-xl border border-border bg-card p-6 shadow-md">
          <form onSubmit={handleAddSubmit}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-card-foreground">
                Añadir beneficiario
              </CardTitle>
            </CardHeader>
            <CardContent className="mb-4 space-y-4 p-0 text-left">
              <div>
                <Label className="mb-2 text-muted-foreground">Address *</Label>
                <Input
                  name="address"
                  id="addressAdd"
                  placeholder="0x123..."
                  className="mt-1 text-foreground"
                  value={beneficiaryData.address}
                  onChange={(e) =>
                    setBeneficiaryData({
                      ...beneficiaryData,
                      address: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label className="mb-2 text-muted-foreground">Nombre *</Label>
                <Input
                  name="name"
                  placeholder="Nombre completo"
                  className="mt-1 text-foreground"
                  value={beneficiaryData.name}
                  onChange={(e) =>
                    setBeneficiaryData({
                      ...beneficiaryData,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label className="mb-2 text-muted-foreground">Teléfono</Label>
                <Input
                  name="phoneNumber"
                  placeholder="Número de teléfono"
                  className="mt-1 text-foreground"
                  value={beneficiaryData.phoneNumber}
                  onChange={(e) =>
                    setBeneficiaryData({
                      ...beneficiaryData,
                      phoneNumber: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label className="mb-2 text-muted-foreground">
                  Responsable
                </Label>
                <Input
                  name="responsable"
                  placeholder="Nombre del responsable"
                  className="mt-1 text-foreground"
                  value={beneficiaryData.responsable}
                  onChange={(e) =>
                    setBeneficiaryData({
                      ...beneficiaryData,
                      responsable: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
            <CardFooter className="p-0">
              <Button
                type="submit"
                className="w-full rounded-lg bg-primary text-white hover:bg-brand-700"
                disabled={isPending || isLoading || createBeneficiary.isPending}
              >
                {(isPending || isLoading || createBeneficiary.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {createBeneficiary.isPending
                  ? 'Guardando en BD...'
                  : isPending || isLoading
                    ? 'Procesando...'
                    : 'Añadir'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
      <TabsContent value="delete">
        <Card className="mx-auto mb-6 w-full max-w-[400px] rounded-xl border border-border bg-card p-6 shadow-md">
          <form onSubmit={handleDeleteSubmit}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-card-foreground">
                Eliminar beneficiario
              </CardTitle>
            </CardHeader>
            <CardContent className="mb-4 p-0 text-left">
              <Label className="mb-2 text-muted-foreground">Address</Label>
              <Input
                name="address"
                id="addressDelete"
                placeholder="0x123..."
                className="mt-1 text-foreground"
              />
            </CardContent>
            <CardFooter className="p-0">
              <Button
                type="submit"
                className="w-full rounded-lg bg-primary text-white hover:bg-brand-700"
                disabled={isPending || isLoading}
              >
                {(isPending || isLoading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Eliminar
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
