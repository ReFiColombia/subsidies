import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, ArrowDownCircle, Users, Wallet, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface DuneStats {
  fundsAdded: number;
  fundsDistributed: number;
  recipients: number;
  contractBalance: number;
}

interface MonthlyData {
  month: string;
  distributed: number;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const chartConfig = {
  distributed: {
    label: 'COPm Distribuidos',
    color: '#8b5cf6',
  },
};

export function ProgramStats() {
  const { data: stats, isLoading: statsLoading } = useQuery<DuneStats>({
    queryKey: ['dune-stats'],
    queryFn: () => fetch(`${API_URL}/api/dune/stats`).then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const { data: monthly, isLoading: monthlyLoading } = useQuery<MonthlyData[]>({
    queryKey: ['dune-monthly'],
    queryFn: () => fetch(`${API_URL}/api/dune/monthly`).then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  if (statsLoading || monthlyLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!stats || !monthly) return null;

  const statCards = [
    { icon: TrendingUp, label: 'Fondos Agregados', value: `${formatCOP(stats.fundsAdded)} COPm`, color: 'text-green-400' },
    { icon: ArrowDownCircle, label: 'Fondos Distribuidos', value: `${formatCOP(stats.fundsDistributed)} COPm`, color: 'text-cyan-400' },
    { icon: Users, label: 'Beneficiarios', value: String(stats.recipients), color: 'text-blue-400' },
    { icon: Wallet, label: 'Balance del Contrato', value: `${formatCOP(stats.contractBalance)} COPm`, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-white text-lg font-semibold text-center">Transparencia del Programa</h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <Icon className={`w-5 h-5 ${color} shrink-0`} />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-bold text-white truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div className="rounded-lg bg-white/5 border border-white/10 p-4">
        <p className="text-xs text-gray-400 mb-3 text-center">Subsidios Distribuidos por Mes</p>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            data={monthly}
            margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
            barSize={20}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
              stroke="rgba(255,255,255,0.4)"
              interval={2}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={10}
              stroke="rgba(255,255,255,0.4)"
              tickMargin={4}
              width={50}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[160px]"
                  nameKey="distributed"
                  formatter={(value: unknown) => `${formatCOP(Number(value))} COPm`}
                />
              }
            />
            <Bar dataKey="distributed" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
