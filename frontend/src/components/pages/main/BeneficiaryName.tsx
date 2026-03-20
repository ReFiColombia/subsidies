import { useTranslation } from 'react-i18next'

import { useBeneficiary } from '@/hooks/useBeneficiaries'

interface BeneficiaryNameProps {
  address: string
  showAddress?: boolean
  className?: string
}

export function BeneficiaryName({
  address,
  showAddress = true,
  className,
}: BeneficiaryNameProps) {
  const { t } = useTranslation('common')
  const { data: beneficiary, isLoading, error } = useBeneficiary(address)

  if (isLoading) {
    return <span className={className}>{t('loading')}</span>
  }

  if (error || !beneficiary) {
    return (
      <span className={className}>
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
    )
  }

  return (
    <span className={className}>
      {beneficiary.name}
      {showAddress && (
        <span className="ml-2 text-xs text-muted-foreground">
          ({address.slice(0, 6)}...{address.slice(-4)})
        </span>
      )}
    </span>
  )
}
