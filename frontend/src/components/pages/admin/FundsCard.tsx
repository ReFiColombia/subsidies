import { getReferralTag, submitReferral } from '@divvi/referral-sdk'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs'
import { Loader2 } from 'lucide-react'
import { erc20Abi, parseUnits } from 'viem'
import {
  useAccount,
  usePublicClient,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CCOP_CONTRACT_ADDRESS,
  DIVVI_CONSUMER_ADDRESS,
  SUBSIDY_CONTRACT_ABI,
  SUBSIDY_CONTRACT_ADDRESS,
} from '@/constants'
import { useToast } from '@/hooks/useToast'

export function FundsCard() {
  const { toast } = useToast()
  const { address } = useAccount()
  const client = usePublicClient()
  const {
    writeContractAsync,
    isPending,
    data: hash,
  } = useWriteContract({
    mutation: {
      onError: (error) => {
        console.error(error)
        toast({
          title: 'Error en la transacción',
          description: error.message,
          variant: 'destructive',
        })
      },
    },
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: CCOP_CONTRACT_ADDRESS,
    functionName: 'allowance',
    args: [address!, SUBSIDY_CONTRACT_ADDRESS],
  })

  const { isLoading } = useWaitForTransactionReceipt({ hash })

  const handleAddSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    try {
      refetchAllowance()

      const formData = new FormData(evt.currentTarget)
      const amount = parseUnits(formData.get('amount') as string, 18)
      if (typeof allowance !== 'bigint') return
      if (allowance < amount) {
        const approveTx = await writeContractAsync({
          abi: erc20Abi,
          address: CCOP_CONTRACT_ADDRESS,
          functionName: 'approve',
          args: [SUBSIDY_CONTRACT_ADDRESS, amount],
        })

        toast({
          title: 'Transacción enviada',
          description: 'Aprobación enviada, esperando confirmación.',
        })

        await refetchAllowance()

        const receipt = await client!.waitForTransactionReceipt({
          hash: approveTx,
          confirmations: 1,
          pollingInterval: 1000,
          timeout: 60000,
        })
        if (receipt.status === 'reverted') {
          toast({
            title: 'Error en la transacción',
            description: 'La transacción de aprobación falló.',
            variant: 'destructive',
          })
          return
        }
      }
      const referralTag = getReferralTag({
        user:
          (address as `0x${string}`) ??
          '0x0000000000000000000000000000000000000000',
        consumer: DIVVI_CONSUMER_ADDRESS,
      })

      const addFundsHash = await writeContractAsync({
        abi: SUBSIDY_CONTRACT_ABI,
        address: SUBSIDY_CONTRACT_ADDRESS,
        functionName: 'addFunds',
        args: [amount],
        dataSuffix: `0x${referralTag}`,
      })

      toast({
        title: 'Transacción enviada',
        description: 'Fondos añadidos correctamente.',
      })

      // Report to Divvi
      submitReferral({ txHash: addFundsHash, chainId: 42220 }).catch((e) =>
        console.warn('Divvi submitReferral failed', e)
      )
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Error en la transacción',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleWithdrawSubmit = async (
    evt: React.FormEvent<HTMLFormElement>
  ) => {
    evt.preventDefault()
    try {
      const referralTag = getReferralTag({
        user:
          (address as `0x${string}`) ??
          '0x0000000000000000000000000000000000000000',
        consumer: DIVVI_CONSUMER_ADDRESS,
      })

      const withdrawHash = await writeContractAsync({
        abi: SUBSIDY_CONTRACT_ABI,
        address: SUBSIDY_CONTRACT_ADDRESS,
        functionName: 'withdrawFunds',
        dataSuffix: `0x${referralTag}`,
      })

      toast({
        title: 'Transacción enviada',
        description: 'Fondos retirados correctamente.',
      })

      // Report to Divvi
      submitReferral({ txHash: withdrawHash, chainId: 42220 }).catch((e) =>
        console.warn('Divvi submitReferral failed', e)
      )
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Error en la transacción',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Tabs defaultValue="add" className="h-full w-full">
      <TabsList className="mb-4 grid w-full grid-cols-2 gap-x-2 rounded-xl bg-gray-100 p-1">
        <TabsTrigger
          value="add"
          className="tab-button rounded-lg transition-colors data-[state=active]:bg-cyan-600 data-[state=inactive]:bg-gray-200 data-[state=active]:text-white data-[state=inactive]:text-gray-700"
        >
          Fondear
        </TabsTrigger>
        <TabsTrigger
          value="delete"
          className="tab-button rounded-lg transition-colors data-[state=active]:bg-cyan-600 data-[state=inactive]:bg-gray-200 data-[state=active]:text-white data-[state=inactive]:text-gray-700"
        >
          Retirar
        </TabsTrigger>
      </TabsList>
      <TabsContent value="add">
        <Card className="mx-auto mb-6 w-full max-w-[400px] rounded-xl border border-gray-200 bg-white p-6 shadow-md">
          <form onSubmit={handleAddSubmit}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Añadir fondos
              </CardTitle>
            </CardHeader>
            <CardContent className="mb-4 p-0 text-left">
              <Label className="mb-2 text-gray-700">Cantidad</Label>
              <Input
                name="amount"
                placeholder="$cCop"
                className="mt-1 text-gray-900"
              />
            </CardContent>
            <CardFooter className="p-0">
              <Button
                disabled={isPending || isLoading}
                className="w-full rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"
              >
                {(isPending || isLoading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Añadir
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
      <TabsContent value="delete">
        <form onSubmit={handleWithdrawSubmit}>
          <Card className="mx-auto mb-6 w-full max-w-[400px] rounded-xl border border-gray-200 bg-white p-6 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Retirar fondos
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-0">
              <Button className="w-full rounded-lg bg-cyan-600 text-white hover:bg-cyan-700">
                Retirar
              </Button>
            </CardFooter>
          </Card>
        </form>
      </TabsContent>
    </Tabs>
  )
}
