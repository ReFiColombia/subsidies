import { getReferralTag, submitReferral } from '@divvi/referral-sdk'
import { ArrowLeftRight, Loader2 } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { erc20Abi, formatUnits, parseUnits } from 'viem'
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from 'wagmi'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  CCOP_CONTRACT_ADDRESS,
  DIVVI_CONSUMER_ADDRESS,
  SUBSIDY_CONTRACT_ABI,
  SUBSIDY_CONTRACT_ADDRESS,
} from '@/constants'
import { useToast } from '@/hooks/useToast'
import { appKit } from '@/providers'

import { DonationProgress, type DonationStep } from './DonationProgress'
import { DonationReceipt } from './DonationReceipt'
import { DonationStats } from './DonationStats'
import { QuickAmountPicker } from './QuickAmountPicker'

const SwapWidget = lazy(() =>
  import('./SwapWidget').then((m) => ({ default: m.SwapWidget }))
)

export function UserFundsCard() {
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const client = usePublicClient()

  const [selectedAmount, setSelectedAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [donationStep, setDonationStep] = useState<DonationStep>('idle')
  const [showSwapWidget, setShowSwapWidget] = useState(false)
  const [receiptData, setReceiptData] = useState<{
    amount: bigint
    txHash: string
  } | null>(null)

  const { writeContractAsync, isPending } = useWriteContract({
    mutation: {
      onError: (error) => {
        console.error(error)
        setDonationStep('idle')
        toast({
          title: 'Error en la transaccion',
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

  const {
    data: balance,
    refetch: refetchBalance,
    isLoading: isBalanceLoading,
  } = useReadContract({
    abi: erc20Abi,
    address: CCOP_CONTRACT_ADDRESS,
    functionName: 'balanceOf',
    args: [address!],
  })

  const balanceLoaded = balance !== undefined
  const hasBalance = balanceLoaded && balance > 0n
  const activeAmount = selectedAmount || customAmount

  const handleQuickSelect = (amount: string) => {
    setSelectedAmount(amount)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount('')
  }

  const handleSwapComplete = () => {
    refetchBalance()
  }

  const handleDonate = async () => {
    if (!activeAmount) return

    try {
      const amount = parseUnits(activeAmount, 18)
      refetchAllowance()

      if (typeof allowance !== 'bigint') return

      // Step 1: Approve if needed
      if (allowance < amount) {
        setDonationStep('approving')

        const approveTx = await writeContractAsync({
          abi: erc20Abi,
          address: CCOP_CONTRACT_ADDRESS,
          functionName: 'approve',
          args: [SUBSIDY_CONTRACT_ADDRESS, amount],
        })

        toast({
          title: 'Aprobacion enviada',
          description: 'Esperando confirmacion...',
        })

        const receipt = await client!.waitForTransactionReceipt({
          hash: approveTx,
          confirmations: 1,
          pollingInterval: 1000,
          timeout: 60000,
        })

        if (receipt.status === 'reverted') {
          setDonationStep('idle')
          toast({
            title: 'Error en la aprobacion',
            description: 'La transaccion de aprobacion fallo.',
            variant: 'destructive',
          })
          return
        }

        await refetchAllowance()
      }

      // Step 2: Donate
      setDonationStep('donating')

      const referralTag = getReferralTag({
        user:
          (address as `0x${string}`) ??
          '0x0000000000000000000000000000000000000000',
        consumer: DIVVI_CONSUMER_ADDRESS,
      })

      const addFundsTx = await writeContractAsync({
        abi: SUBSIDY_CONTRACT_ABI,
        address: SUBSIDY_CONTRACT_ADDRESS,
        functionName: 'addFunds',
        args: [amount],
        dataSuffix: `0x${referralTag}`,
      })

      const donateReceipt = await client!.waitForTransactionReceipt({
        hash: addFundsTx,
        confirmations: 1,
        pollingInterval: 1000,
        timeout: 60000,
      })

      if (donateReceipt.status === 'reverted') {
        setDonationStep('idle')
        toast({
          title: 'Error al donar',
          description: 'La transaccion de donacion fallo.',
          variant: 'destructive',
        })
        return
      }

      // Step 3: Done
      setDonationStep('done')
      setReceiptData({ amount, txHash: addFundsTx })
      refetchBalance()

      submitReferral({ txHash: addFundsTx, chainId: 42220 }).catch((e) =>
        console.warn('Divvi submitReferral failed', e)
      )
    } catch (error: any) {
      console.error(error)
      setDonationStep('idle')
      toast({
        title: 'Error al donar fondos',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleReset = () => {
    setDonationStep('idle')
    setReceiptData(null)
    setSelectedAmount('')
    setCustomAmount('')
    refetchBalance()
  }

  // Show receipt screen after successful donation
  if (receiptData) {
    return (
      <Card className="w-full">
        <DonationReceipt
          amount={receiptData.amount}
          txHash={receiptData.txHash}
          onReset={handleReset}
        />
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-lg font-semibold text-card-foreground">
          Donar fondos
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 px-6 pb-6 pt-0">
        {/* Donation Stats */}
        <DonationStats />

        {/* Balance Display */}
        {isConnected && balance !== undefined && (
          <div className="rounded-lg border border-border bg-muted p-3 text-center">
            <p className="mb-1 text-xs text-muted-foreground">Tu balance</p>
            <p className="text-lg font-bold text-foreground">
              {new Intl.NumberFormat('es-CO', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(Number(formatUnits(balance, 18)))}{' '}
              cCOP
            </p>
          </div>
        )}

        {/* Swap Widget Section */}
        {isConnected && isBalanceLoading ? (
          <div className="py-4 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isConnected && balanceLoaded && !hasBalance ? (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              No tienes COPm. Intercambia cualquier token para obtener COPm:
            </p>
            <Button
              variant="outline"
              className="w-full border-border bg-muted text-foreground hover:bg-brand-800"
              onClick={() => setShowSwapWidget(true)}
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Obtener COPm
            </Button>
          </div>
        ) : isConnected && hasBalance ? (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-600 bg-brand-900 px-4 py-2.5 text-sm font-medium text-brand-300 transition-colors hover:bg-brand-800 hover:text-brand-200"
            onClick={() => setShowSwapWidget(true)}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Necesitas mas COPm? Intercambia aquí
          </button>
        ) : !isConnected ? (
          <Button
            className="w-full"
            onClick={() => appKit.open()}
          >
            Dona aquí
          </Button>
        ) : null}

        {/* Swap Widget Popup */}
        {showSwapWidget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowSwapWidget(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <Suspense
                fallback={
                  <div className="py-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </div>
                }
              >
                <SwapWidget onTransactionComplete={handleSwapComplete} />
              </Suspense>
            </div>
          </div>
        )}

        {/* Quick Amount Picker */}
        {isConnected && hasBalance && (
          <>
            <QuickAmountPicker
              selectedAmount={selectedAmount}
              onSelect={handleQuickSelect}
            />

            {/* Custom Amount Input */}
            <Input
              placeholder="Cantidad personalizada"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              className="border-border bg-background text-center text-foreground"
            />

            {/* Progress Indicator */}
            <DonationProgress currentStep={donationStep} />

            {/* Donate Button */}
            <Button
              disabled={!activeAmount || isPending || donationStep !== 'idle'}
              className="w-full rounded-lg text-primary-foreground"
              onClick={handleDonate}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Donar
              {activeAmount
                ? ` ${Number(activeAmount).toLocaleString('es-CO')} cCOP`
                : ''}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
