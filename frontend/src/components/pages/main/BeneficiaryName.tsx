import { useBeneficiary } from '@/hooks/useBeneficiaries';

interface BeneficiaryNameProps {
  address: string;
  showAddress?: boolean;
  className?: string;
}

export function BeneficiaryName({ address, showAddress = true, className }: BeneficiaryNameProps) {
  const { data: beneficiary, isLoading, error } = useBeneficiary(address);

  if (isLoading) {
    return <span className={className}>Loading...</span>;
  }

  if (error || !beneficiary) {
    return (
      <span className={className}>
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
    );
  }

  return (
    <span className={className}>
      {beneficiary.name}
      {showAddress && (
        <span className="text-xs text-gray-500 ml-2">
          ({address.slice(0, 6)}...{address.slice(-4)})
        </span>
      )}
    </span>
  );
}
