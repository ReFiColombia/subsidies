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
