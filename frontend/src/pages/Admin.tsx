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
      <div className="w-full max-w-md rounded-[20px] border border-[var(--line)] bg-card p-8 text-center">
        <h1 className="font-display text-2xl">{t('adminOnlyTitle')}</h1>
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
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="font-display text-2xl text-foreground md:text-3xl">
          {t('adminPanel')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('adminSubtitle')}
        </p>
      </div>
      {/* Phones and tablets: data first, actions after. Desktop: the two
          action cards side by side on top, the dashboard full width below so
          the beneficiaries table has room for every column. */}
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="order-2 grid min-w-0 grid-cols-1 items-start gap-6 md:grid-cols-2 lg:order-1 lg:gap-8">
          <BeneficiariesCard />
          <FundsCard />
        </div>
        <div className="order-1 flex min-w-0 lg:order-2">
          <Dashboard />
        </div>
      </div>
    </div>
  )
}
