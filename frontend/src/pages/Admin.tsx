import { BeneficiariesCard } from '@/components/pages/admin/BeneficiariesCard'
import { Dashboard } from '@/components/pages/admin/Dashboard'
import { FundsCard } from '@/components/pages/admin/FundsCard'

export function AdminPanel() {
  return (
    <div className="my-8 grid min-h-screen grid-cols-1 gap-4 p-4 md:grid-cols-12 md:gap-10 md:p-0">
      <div className="col-span-12 flex h-full w-full flex-col gap-4 md:col-span-4 md:gap-10">
        <BeneficiariesCard />
        <FundsCard />
      </div>
      <div className="col-span-12 flex min-h-[75vh] w-full justify-center md:col-span-8">
        <Dashboard />
      </div>
    </div>
  )
}
