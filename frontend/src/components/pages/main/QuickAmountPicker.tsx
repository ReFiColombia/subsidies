import { Button } from '@/components/ui/button'

const QUICK_AMOUNTS = [
  { label: '10K', value: '10000' },
  { label: '50K', value: '50000' },
  { label: '100K', value: '100000' },
  { label: '500K', value: '500000' },
]

interface QuickAmountPickerProps {
  selectedAmount: string
  onSelect: (amount: string) => void
}

export function QuickAmountPicker({
  selectedAmount,
  onSelect,
}: QuickAmountPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {QUICK_AMOUNTS.map(({ label, value }) => (
        <Button
          key={value}
          type="button"
          variant={selectedAmount === value ? 'default' : 'outline'}
          className={`text-sm ${
            selectedAmount === value
              ? 'bg-primary text-white'
              : 'border-white/20 bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
          onClick={() => onSelect(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
