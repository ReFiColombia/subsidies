import { useTranslation } from 'react-i18next'

import { BeneficiariesCard } from '@/components/pages/admin/BeneficiariesCard'
import { Dashboard } from '@/components/pages/admin/Dashboard'
import { FundsCard } from '@/components/pages/admin/FundsCard'
import { useIsAdmin } from '@/hooks/useIsAdmin'

// Shown instead of the panel to anyone who is not a program admin.
function AdminNotice({ message }: { message: string }) {
  const { t } = useTranslation('common')
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="max-w-md rounded-lg border p-8 text-center">
        <h1 className="text-xl font-bold">{t('adminOnlyTitle')}</h1>
        <p className="mt-3 text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export function AdminPanel() {
  const { t } = useTranslation('common')
  const { isConnected, isAdmin, isLoading } = useIsAdmin()

  // The panel is only rendered for an admin wallet. Nothing inside it is
  // mounted otherwise, so no beneficiary data is requested.
  if (!isConnected) return <AdminNotice message={t('adminConnect')} />
  if (isLoading) return <AdminNotice message={t('adminChecking')} />
  if (!isAdmin) return <AdminNotice message={t('adminDenied')} />

  return (
    <div className="mx-auto my-6 grid w-full max-w-7xl grid-cols-1 gap-4 px-4 md:my-8 md:px-6 lg:grid-cols-12 lg:gap-8">
      <div className="col-span-12 flex w-full min-w-0 flex-col gap-4 lg:col-span-4 lg:gap-8">
        <BeneficiariesCard />
        <FundsCard />
      </div>
      <div className="col-span-12 flex w-full min-w-0 justify-center lg:col-span-8">
        <Dashboard />
      </div>
    </div>
  )
}
