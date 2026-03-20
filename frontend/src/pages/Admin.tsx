import { BeneficiariesCard } from '@/components/pages/admin/BeneficiariesCard';
import { FundsCard } from '@/components/pages/admin/FundsCard';
import { Dashboard } from '@/components/pages/admin/Dashboard';


export function AdminPanel() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-12 min-h-screen gap-4 md:gap-10 p-4 md:p-0 my-8'>
      <div className='flex flex-col h-full w-full col-span-12 md:col-span-4 gap-4 md:gap-10'>
        <BeneficiariesCard />
        <FundsCard />
      </div>
      <div className='flex justify-center col-span-12 md:col-span-8 min-h-[75vh] w-full'>
        <Dashboard />
      </div>
    </div>
  );
}

