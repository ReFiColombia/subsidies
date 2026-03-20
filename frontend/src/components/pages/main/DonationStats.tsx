import { getBuiltGraphSDK } from '@graphclient'
import { useQuery } from '@tanstack/react-query'
import { Heart, Users } from 'lucide-react'
import { formatUnits } from 'viem'

const sdk = getBuiltGraphSDK()

export function DonationStats() {
  const { data: fundsData } = useQuery({
    queryKey: ['Funds'],
    queryFn: () => sdk.Funds(),
  })

  const { data: beneficiariesData } = useQuery({
    queryKey: ['Beneficiaries'],
    queryFn: () => sdk.Beneficiaries(),
  })

  const totalSupplied = fundsData?.funds_collection[0]?.totalSupplied
  const activeBeneficiaries =
    beneficiariesData?.beneficiaries.filter(
      (b: { isActive: boolean }) => b.isActive
    ).length ?? 0

  const formattedTotal = totalSupplied
    ? new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(formatUnits(totalSupplied, 18)))
    : '...'

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3">
        <Heart className="h-5 w-5 shrink-0 text-brand-400" />
        <div>
          <p className="text-xs text-muted-foreground">Total donado</p>
          <p className="text-sm font-bold text-foreground">{formattedTotal} cCOP</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3">
        <Users className="h-5 w-5 shrink-0 text-brand-400" />
        <div>
          <p className="text-xs text-muted-foreground">Beneficiarios</p>
          <p className="text-sm font-bold text-foreground">{activeBeneficiaries}</p>
        </div>
      </div>
    </div>
  )
}
