import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs'

import { BeneficiariesPanel } from './BeneficiariesPanel'
import { DailyClaimsCard } from './DailyClaimsCard'

export function Dashboard() {
  return (
    <Tabs defaultValue="claims" className="flex h-full w-full flex-col">
      <TabsList className="mb-4 grid w-full grid-cols-2 gap-x-2 rounded-xl bg-gray-100 p-1">
        <TabsTrigger
          value="claims"
          className="tab-button rounded-lg transition-colors data-[state=active]:bg-cyan-600 data-[state=inactive]:bg-gray-200 data-[state=active]:text-white data-[state=inactive]:text-gray-700"
        >
          Fondos
        </TabsTrigger>
        <TabsTrigger
          value="beneficiaries"
          className="tab-button rounded-lg transition-colors data-[state=active]:bg-cyan-600 data-[state=inactive]:bg-gray-200 data-[state=active]:text-white data-[state=inactive]:text-gray-700"
        >
          Beneficiarios
        </TabsTrigger>
      </TabsList>
      <TabsContent value="beneficiaries" className="flex-1">
        <BeneficiariesPanel />
      </TabsContent>
      <TabsContent value="claims" className="flex-1">
        <DailyClaimsCard />
      </TabsContent>
    </Tabs>
  )
}
