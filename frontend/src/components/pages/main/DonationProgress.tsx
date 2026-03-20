import { Check, Loader2 } from 'lucide-react';

type DonationStep = 'idle' | 'approving' | 'donating' | 'done';

interface DonationProgressProps {
  currentStep: DonationStep;
}

const steps = [
  { key: 'approving' as const, label: 'Aprobar' },
  { key: 'donating' as const, label: 'Donar' },
  { key: 'done' as const, label: 'Listo' },
];

const stepOrder: Record<DonationStep, number> = {
  idle: -1,
  approving: 0,
  donating: 1,
  done: 2,
};

export default function DonationProgress({ currentStep }: DonationProgressProps) {
  if (currentStep === 'idle') return null;

  const currentIndex = stepOrder[currentStep];

  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {steps.map((step, index) => {
        const isComplete = currentIndex > index;
        const isActive = currentIndex === index;

        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                isComplete
                  ? 'bg-green-500 text-white'
                  : isActive
                    ? 'bg-primary text-white'
                    : 'bg-white/10 text-gray-500'
              }`}
            >
              {isComplete ? (
                <Check className="w-4 h-4" />
              ) : isActive ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`text-xs ${
                isComplete || isActive ? 'text-white' : 'text-gray-500'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  isComplete ? 'bg-green-500' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export type { DonationStep };
