import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { DailyClaimsCard } from './DailyClaimsCard';
import { BeneficiariesPanel } from './BeneficiariesPanel';

export function Dashboard() {
  return (
    <Tabs defaultValue="claims" className="w-full h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-2 p-1 gap-x-2 bg-gray-100 rounded-xl mb-4">
        <TabsTrigger value="claims" className="tab-button data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=inactive]:bg-gray-200 data-[state=inactive]:text-gray-700 rounded-lg transition-colors">Fondos</TabsTrigger>
        <TabsTrigger value="beneficiaries" className="tab-button data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=inactive]:bg-gray-200 data-[state=inactive]:text-gray-700 rounded-lg transition-colors">Beneficiarios</TabsTrigger>
      </TabsList>
      <TabsContent value="beneficiaries" className="flex-1">
        <BeneficiariesPanel />
      </TabsContent>
      <TabsContent value="claims" className="flex-1">
        <DailyClaimsCard />
      </TabsContent>
    </Tabs>
  );
}

