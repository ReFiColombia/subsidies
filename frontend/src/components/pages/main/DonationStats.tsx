import { useQuery } from '@tanstack/react-query';
import { getBuiltGraphSDK } from '@graphclient';
import { formatUnits } from 'viem';
import { Users, Heart } from 'lucide-react';

const sdk = getBuiltGraphSDK();

export default function DonationStats() {
  const { data: fundsData } = useQuery({
    queryKey: ['Funds'],
    queryFn: () => sdk.Funds(),
  });

  const { data: beneficiariesData } = useQuery({
    queryKey: ['Beneficiaries'],
    queryFn: () => sdk.Beneficiaries(),
  });

  const totalSupplied = fundsData?.funds_collection[0]?.totalSupplied;
  const activeBeneficiaries = beneficiariesData?.beneficiaries.filter(
    (b: { isActive: boolean }) => b.isActive
  ).length ?? 0;

  const formattedTotal = totalSupplied
    ? new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(formatUnits(totalSupplied, 18)))
    : '...';

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
        <Heart className="w-5 h-5 text-pink-400 shrink-0" />
        <div>
          <p className="text-xs text-gray-400">Total donado</p>
          <p className="text-sm font-bold text-white">{formattedTotal} cCOP</p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
        <Users className="w-5 h-5 text-blue-400 shrink-0" />
        <div>
          <p className="text-xs text-gray-400">Beneficiarios</p>
          <p className="text-sm font-bold text-white">{activeBeneficiaries}</p>
        </div>
      </div>
    </div>
  );
}
