import { formatUnits } from 'viem'

import { CardContent } from '@/components/ui/card'

type InfoProps = {
  isWhiteListed: boolean
  lastClaimed: bigint
  totalClaimed: bigint
}

export function Info({ isWhiteListed, lastClaimed, totalClaimed }: InfoProps) {
  const lastClaimedDate = new Date(Number(lastClaimed) * 1000)
  return (
    <CardContent className="space-y-3 pb-4 pt-6 text-center">
      <p className="text-gray-200">
        <span className="font-medium">Última reclamación:</span>{' '}
        {isWhiteListed ? lastClaimedDate.toLocaleDateString('es-CO') : 'N/A'}
      </p>
      <p className="text-gray-200">
        <span className="font-medium">Total reclamado:</span>{' '}
        {isWhiteListed
          ? new Intl.NumberFormat('es-CO', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(Number(formatUnits(totalClaimed, 18)))
          : '0'}{' '}
        cCOP
      </p>
    </CardContent>
  )
}
