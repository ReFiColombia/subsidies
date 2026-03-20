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
  const secondsSinceLastClaimed = Date.now() / 1000 - Number(lastClaimed)
  const daysLeft = secondsToDays(
    Number(claimInterval) - secondsSinceLastClaimed
  )
  const getClaimMessage = () => {
    if (!isWhiteListed) return null
    else if (isAbleToClaim)
      return (
        <span className="block text-center text-sm text-muted-foreground">
          Puedes reclamar tu subsidio cada {claimIntervalInDays} días.
        </span>
      )
    else
      return (
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">
            Ya reclamaste el subsidio de esta semana.
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Regresa en {daysLeft} días para reclamar de nuevo.
          </div>
        </div>
      )
  }

  const claimIntervalInDays = secondsToDays(Number(claimInterval))
  const message = getClaimMessage()

  if (!message) return null

  return (
    <CardHeader>
      <CardTitle>{message}</CardTitle>
    </CardHeader>
  )
}
