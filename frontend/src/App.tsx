import './App.css'

import { getReferralTag, submitReferral } from '@divvi/referral-sdk'
import { ToastAction } from '@radix-ui/react-toast'
import { useAppKitAccount } from '@reown/appkit/react'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { Header } from '@/components/pages/main/Header'
import { Button } from '@/components/ui/button'
import { Card, CardFooter } from '@/components/ui/card'

import { Description } from './components/pages/main/Description'
import { Info } from './components/pages/main/Info'
import { ProgramStats } from './components/pages/main/ProgramStats'
import { UserFundsCard } from './components/pages/main/UserFundsCard'
import {
  DIVVI_CONSUMER_ADDRESS,
  SUBSIDY_CONTRACT_ABI,
  SUBSIDY_CONTRACT_ADDRESS,
} from './constants'
import { useSubsidyContract } from './hooks/useSubsidyContract'
import { useToast } from './hooks/useToast'

export function App() {
  const { toast } = useToast()
  const { address } = useAppKitAccount()

  // Función para generar enlace de Celoscan
  const getCeloscanUrl = (hash: string) => {
    return `https://celoscan.io/tx/${hash}`
  }
  const {
    data: hash,
    writeContract,
    isPending,
  } = useWriteContract({
    mutation: {
      onError: (error) => {
        console.error(error)
        toast({
          title: '❌ Error al reclamar el subsidio',
          description: (
            <div className="space-y-2">
              <p className="text-sm">{error.message}</p>
              <p className="text-xs text-gray-500">
                Verifica que tengas suficiente gas y que tu wallet esté
                conectada.
              </p>
            </div>
          ),
          variant: 'destructive',
          duration: 10000, // 10 segundos para errores
          action: (
            <ToastAction onClick={handleClaim} altText="Intentar de nuevo">
              Intentar de nuevo
            </ToastAction>
          ),
        })
      },
    },
  })

  const handleClaim = () => {
    // Build Divvi referral tag using connected user and provided consumer address
    const referralTag = getReferralTag({
      user:
        (address as `0x${string}`) ??
        '0x0000000000000000000000000000000000000000',
      consumer: DIVVI_CONSUMER_ADDRESS,
    })

    // Append the referral tag using dataSuffix so it doesn't change function args
    writeContract({
      abi: SUBSIDY_CONTRACT_ABI,
      address: SUBSIDY_CONTRACT_ADDRESS,
      functionName: 'claimSubsidy',
      dataSuffix: `0x${referralTag}`,
    })
  }

  const {
    isAbleToClaim,
    claimInterval,
    lastClaimed,
    isWhiteListed,
    totalClaimed,
    valueToClaim,
  } = useSubsidyContract(address)

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash })

  // Mostrar mensaje cuando la transacción está pendiente
  useEffect(() => {
    if (hash && isConfirming) {
      const celoscanUrl = getCeloscanUrl(hash)
      toast({
        title: '⏳ Transacción enviada',
        description: (
          <div className="space-y-2">
            <p>Tu transacción está siendo procesada en la blockchain.</p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Hash:</span>
              <a
                href={celoscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-blue-600 transition-colors hover:bg-gray-200 hover:text-blue-800"
              >
                {hash.slice(0, 10)}...{hash.slice(-8)}
              </a>
            </div>
          </div>
        ),
        duration: 5000,
      })
    }
  }, [hash, isConfirming])

  useEffect(() => {
    if (isConfirmed && hash) {
      const celoscanUrl = getCeloscanUrl(hash)
      toast({
        title: '¡Subsidio reclamado exitosamente! 🎉',
        description: (
          <div className="space-y-2">
            <p>Tu subsidio ha sido reclamado correctamente.</p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Hash:</span>
              <a
                href={celoscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-blue-600 transition-colors hover:bg-gray-200 hover:text-blue-800"
              >
                {hash.slice(0, 10)}...{hash.slice(-8)}
              </a>
            </div>
          </div>
        ),
        duration: 8000, // 8 segundos para dar tiempo a leer
      })

      // Report transaction to Divvi for attribution
      submitReferral({ txHash: hash, chainId: 42220 }).catch((e) => {
        console.warn('Divvi submitReferral failed', e)
      })
    }
  }, [isConfirmed, hash])

  return (
    <div className="flex h-full w-full flex-1 flex-col items-center justify-center overflow-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="flex flex-col items-stretch gap-8">
          {/* Header */}
          <div className="w-full">
            <Header
              isWhiteListed={isWhiteListed}
              isAbleToClaim={isAbleToClaim}
              lastClaimed={lastClaimed}
              claimInterval={claimInterval}
              valueToClaim={valueToClaim}
            />
          </div>

          {/* Claim Card */}
          <Card className="w-full">
            <Description
              isWhiteListed={isWhiteListed}
              isAbleToClaim={isAbleToClaim}
              lastClaimed={lastClaimed}
              claimInterval={claimInterval}
            />
            <Info
              isWhiteListed={isWhiteListed}
              lastClaimed={lastClaimed}
              totalClaimed={totalClaimed}
            />
            <CardFooter className="px-6 pb-6 pt-2">
              <Button
                disabled={
                  !isWhiteListed || !isAbleToClaim || isPending || isConfirming
                }
                className="w-full"
                onClick={handleClaim}
              >
                {(isPending || isConfirming) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reclamar
              </Button>
            </CardFooter>
          </Card>

          {/* Program Stats from Dune */}
          <div className="w-full">
            <ProgramStats />
          </div>

          {/* Donate Funds Card */}
          <div className="w-full">
            <UserFundsCard />
            <p className="mt-6 text-center text-sm leading-relaxed text-gray-300">
              Recuerda que esta donación es voluntaria y no se puede retirar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
