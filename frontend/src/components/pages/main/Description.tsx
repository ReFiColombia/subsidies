import { useTranslation } from 'react-i18next'

import { CardHeader, CardTitle } from '@/components/ui/card'
import { secondsToDays } from '@/lib/utils'

type DescriptionProps = {
  isWhiteListed: boolean
  isAbleToClaim: boolean
  lastClaimed: bigint
  claimInterval: bigint
}

export function Description({
  isWhiteListed,
  isAbleToClaim,
  lastClaimed,
  claimInterval,
}: DescriptionProps) {
  const { t } = useTranslation('main')
  const secondsSinceLastClaimed = Date.now() / 1000 - Number(lastClaimed)
  const daysLeft = secondsToDays(
    Number(claimInterval) - secondsSinceLastClaimed
  )
  const claimIntervalInDays = secondsToDays(Number(claimInterval))

  const getClaimMessage = () => {
    if (!isWhiteListed) return null
    else if (isAbleToClaim)
      return (
        <span className="block text-center text-sm text-muted-foreground">
          {t('claimEveryDays', { days: claimIntervalInDays })}
        </span>
      )
    else
      return (
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">
            {t('alreadyClaimed')}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {t('comeBackIn', { days: daysLeft })}
          </div>
        </div>
      )
  }

  const message = getClaimMessage()

  if (!message) return null

  return (
    <CardHeader>
      <CardTitle>{message}</CardTitle>
    </CardHeader>
  )
}
