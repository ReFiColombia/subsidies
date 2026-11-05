import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs'

import { BeneficiariesPanel } from './BeneficiariesPanel'
import { DailyClaimsCard } from './DailyClaimsCard'
import { adminTabsList, adminTabsTrigger } from './tabStyles'

export function Dashboard() {
  return (
    <Tabs defaultValue="claims" className="flex h-full w-full flex-col">
      <TabsList className={adminTabsList}>
        <TabsTrigger value="claims" className={adminTabsTrigger}>
          Fondos
        </TabsTrigger>
        <TabsTrigger value="beneficiaries" className={adminTabsTrigger}>
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
