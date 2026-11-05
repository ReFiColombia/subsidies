import { getBuiltGraphSDK } from '@graphclient'
import { useQuery } from '@tanstack/react-query'
import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { formatUnits } from 'viem'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const sdk = getBuiltGraphSDK()

export function DailyClaimsCard() {
  const { data: data_claims } = useQuery({
    queryKey: ['DailyClaims'],
    queryFn: () => sdk.DailyClaims(),
  })

  const { data: data_funds } = useQuery({
    queryKey: ['Funds'],
    queryFn: () => sdk.Funds(),
  })

  const funds = data_funds?.funds_collection[0]

  const chartData =
    data_claims?.dailyClaims
      .map((claim) => ({
        date: new Date(Number(claim.date) * 1000).toLocaleDateString('es-CO', {
          month: 'numeric',
          day: 'numeric',
        }),
        fullDate: new Date(Number(claim.date) * 1000).toLocaleDateString(),
        claims: Number(claim.totalClaims),
        amount: Number(formatUnits(claim.totalAmount, 18)),
      }))
      .reverse() || []

  const [activeChart, setActiveChart] = React.useState<'claims' | 'amount'>(
    'claims'
  )

  const chartConfig = {
    claims: {
      label: 'Cantidad de Reclamos',
      color: 'hsl(232, 88%, 66%)',
    },
    amount: {
      label: 'Monto Reclamado',
      color: 'hsl(269, 97%, 85%)',
    },
  }

  // Phones drop the rotated axis title so the bars get the full width.
  const [isNarrow, setIsNarrow] = React.useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640
  )
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const onChange = () => setIsNarrow(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div className="flex w-full min-w-0 flex-col items-center justify-center">
      <Card className="w-full p-0">
        <CardHeader className="flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg text-card-foreground md:text-xl">
              Reclamos Diarios
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Visualiza la cantidad de reclamos o el monto reclamado por día de
              los últimos 60 días
            </CardDescription>
          </div>
          <Tabs
            value={activeChart}
            onValueChange={(v) => setActiveChart(v as 'claims' | 'amount')}
          >
            <TabsList className="inline-flex w-full rounded-full border border-[var(--line)] bg-muted/60 p-1 sm:w-auto">
              <TabsTrigger
                value="claims"
                className="flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground sm:flex-none"
              >
                Cantidad
              </TabsTrigger>
              <TabsTrigger
                value="amount"
                className="flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground sm:flex-none"
              >
                Monto
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <ChartContainer
              config={chartConfig}
              className="h-[240px] w-full md:h-[320px]"
            >
              <BarChart
                data={chartData}
                margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                barSize={28}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={18}
                  fontSize={13}
                  stroke="hsl(232, 88%, 66%)"
                  label={{
                    value: 'Fecha',
                    position: 'bottom',
                    offset: 0,
                    style: {
                      textAnchor: 'middle',
                      fontSize: 12,
                      fill: 'rgba(255,255,255,0.7)',
                    },
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={13}
                  stroke="hsl(232, 88%, 66%)"
                  tickMargin={8}
                  width={isNarrow ? 44 : 60}
                  label={
                    isNarrow
                      ? undefined
                      : {
                          value:
                            activeChart === 'claims'
                              ? 'Cantidad de Reclamos'
                              : 'Monto Reclamado (COPm)',
                          angle: -90,
                          position: 'left',
                          style: {
                            textAnchor: 'middle',
                            fontSize: 12,
                            fill: 'rgba(255,255,255,0.7)',
                          },
                        }
                  }
                  tickFormatter={(value) =>
                    activeChart === 'amount'
                      ? `$${(value / 1000).toLocaleString('es-CO', { maximumFractionDigits: 0 })} k`
                      : value
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[150px]"
                      nameKey={activeChart}
                      labelFormatter={(value) =>
                        chartData?.find((d) => d.date === value)?.fullDate
                      }
                      formatter={(value: any) =>
                        activeChart === 'amount'
                          ? `Monto reclamado: $${Number(value).toLocaleString('es-CO')}`
                          : `Cantidad de reclamos: ${value}`
                      }
                    />
                  }
                />
                <Bar
                  dataKey={activeChart}
                  fill={chartConfig[activeChart].color}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <Card className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-muted/60 px-4 py-3 shadow-none sm:flex-col sm:items-start sm:justify-center sm:gap-1 sm:px-5 sm:py-4">
              <p className="text-sm font-medium text-muted-foreground sm:mb-1">
                Total aportado
              </p>
              <p className="whitespace-nowrap text-base font-bold tabular-nums text-card-foreground sm:text-xl">
                {new Intl.NumberFormat('es-CO', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(
                  Number(formatUnits(funds ? funds.totalSupplied : 0, 18))
                )}{' '}
                COPm
              </p>
            </Card>
            <Card className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-muted/60 px-4 py-3 shadow-none sm:flex-col sm:items-start sm:justify-center sm:gap-1 sm:px-5 sm:py-4">
              <p className="text-sm font-medium text-muted-foreground sm:mb-1">
                Total retirado
              </p>
              <p className="whitespace-nowrap text-base font-bold tabular-nums text-card-foreground sm:text-xl">
                {new Intl.NumberFormat('es-CO', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(
                  Number(formatUnits(funds ? funds.totalWithdrawn : 0, 18))
                )}{' '}
                COPm
              </p>
            </Card>
            <Card className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-muted/60 px-4 py-3 shadow-none sm:flex-col sm:items-start sm:justify-center sm:gap-1 sm:px-5 sm:py-4">
              <p className="text-sm font-medium text-muted-foreground sm:mb-1">
                Total reclamado
              </p>
              <p className="whitespace-nowrap text-base font-bold tabular-nums text-card-foreground sm:text-xl">
                {new Intl.NumberFormat('es-CO', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(
                  Number(formatUnits(funds ? funds.totalClaimed : 0, 18))
                )}{' '}
                COPm
              </p>
            </Card>
            <Card className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-muted/60 px-4 py-3 shadow-none sm:flex-col sm:items-start sm:justify-center sm:gap-1 sm:px-5 sm:py-4">
              <p className="text-sm font-medium text-muted-foreground sm:mb-1">
                Balance actual
              </p>
              <p className="whitespace-nowrap text-base font-bold tabular-nums text-card-foreground sm:text-xl">
                {new Intl.NumberFormat('es-CO', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(
                  Number(formatUnits(funds ? funds.contractBalance : 0, 18))
                )}{' '}
                COPm
              </p>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
