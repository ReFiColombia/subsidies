import confetti from 'canvas-confetti'
import { ArrowLeft, ExternalLink, Share2 } from 'lucide-react'
import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { formatUnits } from 'viem'

import { Button } from '@/components/ui/button'

interface DonationReceiptProps {
  amount: bigint
  txHash: string
  onReset: () => void
}

export function DonationReceipt({
  amount,
  txHash,
  onReset,
}: DonationReceiptProps) {
  const { t, i18n } = useTranslation('main')
  const locale = i18n.language === 'es' ? 'es-CO' : 'en-US'

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }, [])

  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(formatUnits(amount, 18)))

  const celoscanUrl = `https://celoscan.io/tx/${txHash}`

  const shareText = t('shareText', { amount: formattedAmount, url: celoscanUrl })
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
      <div className="text-4xl">🎉</div>
      <h3 className="text-lg font-bold text-foreground">
        {t('donationSuccess')}
      </h3>
      <p className="text-sm text-muted-foreground">
        <Trans
          i18nKey="main:donatedAmount"
          values={{ amount: formattedAmount }}
          components={{ bold: <span className="font-bold text-foreground" /> }}
        />
      </p>

      <div className="flex w-full flex-col gap-2">
        <a
          href={celoscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-brand-400 hover:text-brand-300"
        >
          <ExternalLink className="h-4 w-4" />
          {t('viewOnCeloscan')}
        </a>

        <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
          <Button
            type="button"
            variant="outline"
            className="w-full border-border bg-muted text-foreground hover:bg-brand-800"
          >
            <Share2 className="mr-2 h-4 w-4" />
            {t('shareOnX')}
          </Button>
        </a>

        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={onReset}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('makeAnotherDonation')}
        </Button>
      </div>
    </div>
  )
}
