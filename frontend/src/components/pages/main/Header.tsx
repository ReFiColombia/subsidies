import { formatUnits } from 'viem'

import { Button } from '@/components/ui/button'
import { secondsToDays } from '@/lib/utils'

type HeaderProps = {
  isWhiteListed: boolean
  isAbleToClaim: boolean
  lastClaimed: bigint
  claimInterval: bigint
  valueToClaim: bigint
}

export function Header({
  isWhiteListed,
  isAbleToClaim,
  lastClaimed,
  claimInterval,
  valueToClaim,
}: HeaderProps) {
  const getHeaderMessage = () => {
    if (!isWhiteListed) {
      return (
        <div className="space-y-6 text-center">
          <div className="text-sm leading-relaxed text-muted-foreground">
            <p className="mb-3">
              El Programa de Subsidios ReFi Colombia es una iniciativa que
              proporciona subsidios periódicos en cCOP (Celo Colombian Peso) a
              beneficiarios elegibles en la red Celo.
            </p>
            <p>
              Los beneficiarios pueden reclamar su subsidio cada cierto
              intervalo de tiempo, contribuyendo así a la inclusión financiera y
              el acceso a servicios descentralizados.
            </p>
          </div>
          <div className="rounded-lg bg-gradient-to-r from-brand-600 to-brand-800 p-4 text-lg font-bold text-foreground">
            Lo sentimos, aún no eres beneficiario
          </div>
          <Button asChild className="w-full text-sm">
            <a target="_blank" href="https://tinyurl.com/ReFiMedUBIRequest">
              Registrate aquí
            </a>
          </Button>
        </div>
      )
    } else if (isAbleToClaim) {
      return (
        <div className="text-center text-lg font-semibold text-foreground">
          Monto disponible para reclamar:{' '}
          {new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(Number(formatUnits(valueToClaim, 18)))}{' '}
          cCOP
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
            Ya reclamaste el subsidio de esta semana.
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Regresa en {daysLeft} días para reclamar de nuevo.
          </div>
        </div>
      )
    }
  }

  return <div className="w-full">{getHeaderMessage()}</div>
}
