import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getBuiltGraphSDK } from '@/../.graphclient';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";

const sdk = getBuiltGraphSDK();

function DailyClaimsCard() {
  const { data: data_claims } = useQuery({ 
    queryKey: ['DailyClaims'], 
    queryFn: () => sdk.DailyClaims() 
  });

  const { data: data_funds } = useQuery({ 
    queryKey: ['Funds'], 
    queryFn: () => sdk.Funds() 
  });

  const funds = data_funds?.funds_collection[0];

  const chartData = data_claims?.dailyClaims.map(claim => ({
    date: new Date(Number(claim.date) * 1000).toLocaleDateString('es-CO', { month: 'numeric', day: 'numeric' }),
    fullDate: new Date(Number(claim.date) * 1000).toLocaleDateString(),
    claims: Number(claim.totalClaims),
    amount: Number(formatUnits(claim.totalAmount, 18))
  })).reverse() || [];

  const [activeChart, setActiveChart] = React.useState<'claims' | 'amount'>('claims');

  const chartConfig = {
    claims: {
      label: "Cantidad de Reclamos",
      color: "#6366f1"
    },
    amount: {
      label: "Monto Reclamado",
      color: "#06b6d4"
    }
  };

  return (
    <div className='flex flex-col items-center justify-center max-w-[90vw] overflow-auto'>
      <Card className="w-full bg-white shadow-md rounded-xl border border-gray-200 p-0">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b p-6">
          <div>
            <CardTitle className="text-lg md:text-xl font-bold text-gray-800">Reclamos Diarios</CardTitle>
            <CardDescription className="text-sm text-gray-500">Visualiza la cantidad de reclamos o el monto reclamado por día de los últimos 60 días</CardDescription>
          </div>
          <Tabs value={activeChart} onValueChange={v => setActiveChart(v as 'claims' | 'amount')}>
            <TabsList className="bg-gray-100 rounded-xl p-1">
              <TabsTrigger value="claims" className="tab-button data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=inactive]:bg-gray-200 data-[state=inactive]:text-gray-700 rounded-lg transition-colors px-4">Cantidad</TabsTrigger>
              <TabsTrigger value="amount" className="tab-button data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=inactive]:bg-gray-200 data-[state=inactive]:text-gray-700 rounded-lg transition-colors px-4">Monto</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <ChartContainer config={chartConfig} className="h-[260px] md:h-[320px] min-w-[600px] w-full">
              <BarChart
                data={chartData}
                margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                barSize={28}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e0e7ef" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={18}
                  fontSize={13}
                  stroke="#6366f1"
                  label={{ value: 'Fecha', position: 'bottom', offset: 0, style: { textAnchor: 'middle', fontSize: 12, fill: '#000000' } }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={13}
                  stroke="#6366f1"
                  tickMargin={8}
                  width={60}
                  label={{ 
                    value: activeChart === 'claims' ? 'Cantidad de Reclamos' : 'Monto Reclamado (cCop)', 
                    angle: -90, 
                    position: 'left',
                    style: { textAnchor: 'middle', fontSize: 12, fill: '#000000' }
                  }}
                  tickFormatter={value => activeChart === 'amount' ? `$${(value/1000).toLocaleString('es-CO', { maximumFractionDigits: 0 })} k` : value}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[150px]"
                      nameKey={activeChart}
                      labelFormatter={(value) => chartData?.find(d => d.date === value)?.fullDate}
                      formatter={(value: any) => activeChart === 'amount' ? `Monto reclamado: $${Number(value).toLocaleString('es-CO')}` : `Cantidad de reclamos: ${value}`}
                    />
                  }
                />
                <Bar dataKey={activeChart} fill={chartConfig[activeChart].color} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 overflow-x-auto">
            <Card className="p-6 border border-gray-200 shadow-sm bg-gray-50 rounded-lg min-w-[180px] flex flex-col items-center justify-center text-center">
              <p className="text-gray-500 text-sm font-medium mb-2">Total aportado</p>
              <p className="font-bold text-lg md:text-xl text-gray-800">
                {new Intl.NumberFormat(
                  "es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                ).format(Number(formatUnits(funds ? funds.totalSupplied : 0, 18)))} cCOP
              </p>
            </Card>
            <Card className="p-6 border border-gray-200 shadow-sm bg-gray-50 rounded-lg min-w-[180px] flex flex-col items-center justify-center text-center">
              <p className="text-gray-500 text-sm font-medium mb-2">Total retirado</p>
              <p className="font-bold text-lg md:text-xl text-gray-800">
                {new Intl.NumberFormat(
                  "es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                ).format(Number(formatUnits(funds ? funds.totalWithdrawn : 0, 18)))} cCOP
              </p>
            </Card>
            <Card className="p-6 border border-gray-200 shadow-sm bg-gray-50 rounded-lg min-w-[180px] flex flex-col items-center justify-center text-center">
              <p className="text-gray-500 text-sm font-medium mb-2">Total reclamado</p>
              <p className="font-bold text-lg md:text-xl text-gray-800">
                {new Intl.NumberFormat(
                  "es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                ).format(Number(formatUnits(funds ? funds.totalClaimed : 0, 18)))} cCOP
              </p>
            </Card>
            <Card className="p-6 border border-gray-200 shadow-sm bg-gray-50 rounded-lg min-w-[180px] flex flex-col items-center justify-center text-center">
              <p className="text-gray-500 text-sm font-medium mb-2">Balance actual</p>
              <p className="font-bold text-lg md:text-xl text-gray-800">
                {new Intl.NumberFormat(
                  "es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                ).format(Number(formatUnits(funds ? funds.contractBalance : 0, 18)))} cCOP
              </p>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DailyClaimsCard 