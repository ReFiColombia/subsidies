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
      color: 'hsl(271, 81%, 56%)',
    },
    amount: {
      label: 'Monto Reclamado',
      color: 'hsl(269, 97%, 85%)',
    },
  }

  return (
    <div className="flex max-w-[90vw] flex-col items-center justify-center overflow-auto">
      <Card className="w-full rounded-xl border border-border bg-card p-0 shadow-md">
        <CardHeader className="flex flex-col gap-2 border-b p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-card-foreground md:text-xl">
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
            <TabsList className="rounded-xl bg-muted p-1">
              <TabsTrigger
                value="claims"
                className="tab-button rounded-lg px-4 transition-colors data-[state=active]:bg-primary data-[state=inactive]:bg-muted data-[state=active]:text-white data-[state=inactive]:text-muted-foreground"
              >
                Cantidad
              </TabsTrigger>
              <TabsTrigger
                value="amount"
                className="tab-button rounded-lg px-4 transition-colors data-[state=active]:bg-primary data-[state=inactive]:bg-muted data-[state=active]:text-white data-[state=inactive]:text-muted-foreground"
              >
                Monto
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <ChartContainer
              config={chartConfig}
              className="h-[260px] w-full min-w-[600px] md:h-[320px]"
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
                  stroke="hsl(271, 81%, 56%)"
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
                  stroke="hsl(271, 81%, 56%)"
                  tickMargin={8}
                  width={60}
                  label={{
                    value:
                      activeChart === 'claims'
                        ? 'Cantidad de Reclamos'
                        : 'Monto Reclamado (cCop)',
                    angle: -90,
                    position: 'left',
                    style: {
                      textAnchor: 'middle',
                      fontSize: 12,
                      fill: 'rgba(255,255,255,0.7)',
                    },
                  }}
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
          <div className="mt-6 grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex min-w-[180px] flex-col items-center justify-center rounded-lg border border-border bg-muted p-6 text-center shadow-sm">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Total aportado
              </p>
              <p className="text-lg font-bold text-card-foreground md:text-xl">
                {new Intl.NumberFormat('es-CO', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(
                  Number(formatUnits(funds ? funds.totalSupplied : 0, 18))
                )}{' '}
                cCOP
              </p>
            </Card>
            <Card className="flex min-w-[180px] flex-col items-center justify-center rounded-lg border border-border bg-muted p-6 text-center shadow-sm">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Total retirado
              </p>
              <p className="text-lg font-bold text-card-foreground md:text-xl">
                {new Intl.NumberFormat('es-CO', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(
                  Number(formatUnits(funds ? funds.totalWithdrawn : 0, 18))
                )}{' '}
                cCOP
              </p>
            </Card>
            <Card className="flex min-w-[180px] flex-col items-center justify-center rounded-lg border border-border bg-muted p-6 text-center shadow-sm">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Total reclamado
              </p>
              <p className="text-lg font-bold text-card-foreground md:text-xl">
                {new Intl.NumberFormat('es-CO', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(
                  Number(formatUnits(funds ? funds.totalClaimed : 0, 18))
                )}{' '}
                cCOP
              </p>
            </Card>
            <Card className="flex min-w-[180px] flex-col items-center justify-center rounded-lg border border-border bg-muted p-6 text-center shadow-sm">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Balance actual
              </p>
              <p className="text-lg font-bold text-card-foreground md:text-xl">
                {new Intl.NumberFormat('es-CO', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(
                  Number(formatUnits(funds ? funds.contractBalance : 0, 18))
                )}{' '}
                cCOP
              </p>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
