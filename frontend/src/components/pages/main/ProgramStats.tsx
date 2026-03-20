import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownCircle,
  Loader2,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface DuneStats {
  fundsAdded: number
  fundsDistributed: number
  recipients: number
  contractBalance: number
}

interface MonthlyData {
  month: string
  distributed: number
}

export function ProgramStats() {
  const { t, i18n } = useTranslation('main')
  const locale = i18n.language === 'es' ? 'es-CO' : 'en-US'

  const formatCOP = (value: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  const chartConfig = {
    distributed: {
      label: t('copmDistributed'),
      color: 'hsl(271, 81%, 56%)',
    },
  }

  const { data: stats, isLoading: statsLoading } = useQuery<DuneStats>({
    queryKey: ['dune-stats'],
    queryFn: () => fetch(`${API_URL}/api/dune/stats`).then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  })

  const { data: monthly, isLoading: monthlyLoading } = useQuery<MonthlyData[]>(
    {
      queryKey: ['dune-monthly'],
      queryFn: () =>
        fetch(`${API_URL}/api/dune/monthly`).then((r) => r.json()),
      staleTime: 5 * 60 * 1000,
    }
  )

  if (statsLoading || monthlyLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!stats || !monthly) return null

  const statCards = [
    {
      icon: TrendingUp,
      label: t('fundsAdded'),
      value: `${formatCOP(stats.fundsAdded)} COPm`,
      color: 'text-brand-300',
    },
    {
      icon: ArrowDownCircle,
      label: t('fundsDistributed'),
      value: `${formatCOP(stats.fundsDistributed)} COPm`,
      color: 'text-brand-400',
    },
    {
      icon: Users,
      label: t('beneficiaries'),
      value: String(stats.recipients),
      color: 'text-brand-500',
    },
    {
      icon: Wallet,
      label: t('contractBalance'),
      value: `${formatCOP(stats.contractBalance)} COPm`,
      color: 'text-brand-400',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-center text-lg font-semibold text-foreground">
        {t('transparencyTitle')}
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-lg border border-border bg-muted p-3"
          >
            <Icon className={`h-5 w-5 ${color} shrink-0`} />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="truncate text-sm font-bold text-foreground">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div className="rounded-lg border border-border bg-muted p-4">
        <p className="mb-3 text-center text-xs text-muted-foreground">
          {t('subsidiesByMonth')}
        </p>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            data={monthly}
            margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
            barSize={20}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
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
                  formatter={(value: unknown) =>
                    `${formatCOP(Number(value))} COPm`
                  }
                />
              }
            />
            <Bar
              dataKey="distributed"
              fill="hsl(271, 81%, 56%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}
