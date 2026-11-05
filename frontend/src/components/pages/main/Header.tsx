import { useTranslation } from 'react-i18next'
import { formatUnits } from 'viem'

import { Button } from '@/components/ui/button'
import { secondsToDays } from '@/lib/utils'
import { appKit } from '@/providers'

type HeaderProps = {
  isConnected: boolean
  isWhiteListed: boolean
  isAbleToClaim: boolean
  lastClaimed: bigint
  claimInterval: bigint
  valueToClaim: bigint
}

export function Header({
  isConnected,
  isWhiteListed,
  isAbleToClaim,
  lastClaimed,
  claimInterval,
  valueToClaim,
}: HeaderProps) {
  const { t, i18n } = useTranslation('main')
  const locale = i18n.language === 'es' ? 'es-CO' : 'en-US'

  const getHeaderMessage = () => {
    if (!isConnected) {
      return (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{t('connectToClaim')}</p>
          <Button className="w-full text-sm" onClick={() => appKit.open()}>
            {t('connectWallet')}
          </Button>
        </div>
      )
    }
    if (!isWhiteListed) {
      return (
        <div className="space-y-4 text-center">
          <div className="rounded-lg border border-border bg-muted p-3 text-sm font-medium text-muted-foreground">
            {t('notBeneficiary')}
          </div>
          <Button asChild className="w-full text-sm">
            <a target="_blank" href="https://tinyurl.com/ReFiMedUBIRequest">
              {t('registerHere')}
            </a>
          </Button>
        </div>
      )
    } else if (isAbleToClaim) {
      const formattedAmount = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(formatUnits(valueToClaim, 18)))
      return (
        <div className="text-center text-lg font-semibold text-foreground">
          {t('amountAvailable', { amount: formattedAmount })}
        </div>
      )
    } else {
      const secondsSinceLastClaimed = Date.now() / 1000 - Number(lastClaimed)
      const daysLeft = secondsToDays(
        Number(claimInterval) - secondsSinceLastClaimed
      )
      return (
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">
            {t('alreadyClaimed')}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {t('comeBackIn', { days: daysLeft })}
          </div>
        </div>
      )
    }
  }

  return <div className="w-full">{getHeaderMessage()}</div>
}
