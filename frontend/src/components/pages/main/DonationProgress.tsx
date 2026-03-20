import { Check, Loader2 } from 'lucide-react'

type DonationStep = 'idle' | 'approving' | 'donating' | 'done'

interface DonationProgressProps {
  currentStep: DonationStep
}

const steps = [
  { key: 'approving' as const, label: 'Aprobar' },
  { key: 'donating' as const, label: 'Donar' },
  { key: 'done' as const, label: 'Listo' },
]

const stepOrder: Record<DonationStep, number> = {
  idle: -1,
  approving: 0,
  donating: 1,
  done: 2,
}

export function DonationProgress({ currentStep }: DonationProgressProps) {
  if (currentStep === 'idle') return null

  const currentIndex = stepOrder[currentStep]

  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {steps.map((step, index) => {
        const isComplete = currentIndex > index
        const isActive = currentIndex === index

        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                isComplete
                  ? 'bg-success text-success-foreground'
                  : isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {isComplete ? (
                <Check className="h-4 w-4" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`text-xs ${
                isComplete || isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 ${
                  isComplete ? 'bg-success' : 'bg-muted'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export type { DonationStep }
