import { useTranslation } from 'react-i18next'
import { formatUnits } from 'viem'

import { CardContent } from '@/components/ui/card'

type InfoProps = {
  isWhiteListed: boolean
  lastClaimed: bigint
  totalClaimed: bigint
}

export function Info({ isWhiteListed, lastClaimed, totalClaimed }: InfoProps) {
  const { t, i18n } = useTranslation('main')
  const locale = i18n.language === 'es' ? 'es-CO' : 'en-US'
  const lastClaimedDate = new Date(Number(lastClaimed) * 1000)

  return (
    <CardContent className="space-y-3 pb-4 pt-6 text-center">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium">{t('lastClaim')}</span>{' '}
        {isWhiteListed ? lastClaimedDate.toLocaleDateString(locale) : 'N/A'}
      </p>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium">{t('totalClaimed')}</span>{' '}
        {isWhiteListed
          ? new Intl.NumberFormat(locale, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(Number(formatUnits(totalClaimed, 18)))
          : '0'}{' '}
        cCOP
      </p>
    </CardContent>
  )
}
