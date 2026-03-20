import './App.css'

import { getReferralTag, submitReferral } from '@divvi/referral-sdk'
import { ToastAction } from '@radix-ui/react-toast'
import { useAppKitAccount } from '@reown/appkit/react'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('common')
  const { t: tMain } = useTranslation('main')
  const { toast } = useToast()
  const { address } = useAppKitAccount()

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
          title: t('claimErrorTitle'),
          description: (
            <div className="space-y-2">
              <p className="text-sm">{error.message}</p>
              <p className="text-xs text-muted-foreground">
                {t('claimErrorDescription')}
              </p>
            </div>
          ),
          variant: 'destructive',
          duration: 10000,
          action: (
            <ToastAction onClick={handleClaim} altText={t('tryAgain')}>
              {t('tryAgain')}
            </ToastAction>
          ),
        })
      },
    },
  })

  const handleClaim = () => {
    const referralTag = getReferralTag({
      user:
        (address as `0x${string}`) ??
        '0x0000000000000000000000000000000000000000',
      consumer: DIVVI_CONSUMER_ADDRESS,
    })

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

  useEffect(() => {
    if (hash && isConfirming) {
      const celoscanUrl = getCeloscanUrl(hash)
      toast({
        title: t('txSentTitle'),
        description: (
          <div className="space-y-2">
            <p>{t('txSentDescription')}</p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                {t('hashLabel')}
              </span>
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
        duration: 5000,
      })
    }
  }, [hash, isConfirming])

  useEffect(() => {
    if (isConfirmed && hash) {
      const celoscanUrl = getCeloscanUrl(hash)
      toast({
        title: t('claimSuccessTitle'),
        description: (
          <div className="space-y-2">
            <p>{t('claimSuccessDescription')}</p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                {t('hashLabel')}
              </span>
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
                {tMain('claimButton')}
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
            <p className="mt-6 text-center text-sm leading-relaxed text-muted-foreground">
              {tMain('donationDisclaimer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
