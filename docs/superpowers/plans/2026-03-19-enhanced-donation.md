# Enhanced Donation Experience — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable cross-chain token donations via Squid widget and redesign the donation UX with quick-pick amounts, progress indicators, donation stats, and a thank-you receipt screen.

**Architecture:** Embed the `@0xsquid/widget` React component with destination locked to COPm on Celo. Conditionally show the swap widget based on user's COPm balance. Preserve existing `addFunds(uint256)` flow with Divvi referral SDK. Pull donation stats from the existing subgraph via `getBuiltGraphSDK()`.

**Tech Stack:** React 18, Vite, Wagmi v2, viem, @0xsquid/widget, @tanstack/react-query, canvas-confetti, Tailwind CSS, shadcn/ui, @divvi/referral-sdk

**Spec:** `docs/superpowers/specs/2026-03-19-enhanced-donation-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `frontend/src/components/pages/main/SwapWidget.tsx` | Squid widget wrapper with error boundary |
| Create | `frontend/src/components/pages/main/DonationStats.tsx` | Donation info section (total donated, beneficiaries) |
| Create | `frontend/src/components/pages/main/DonationReceipt.tsx` | Post-donation thank-you screen with share + confetti |
| Create | `frontend/src/components/pages/main/QuickAmountPicker.tsx` | Quick-pick amount buttons |
| Create | `frontend/src/components/pages/main/DonationProgress.tsx` | Multi-step progress indicator |
| Rewrite | `frontend/src/components/pages/main/UserFundsCard.tsx` | Orchestrates all donation sub-components |
| Modify | `frontend/src/constants/index.ts` | Add Squid env var reference |
| Modify | `frontend/.env` | Add `VITE_SQUID_INTEGRATOR_ID` |
| Modify | `frontend/.env.example` | Document `VITE_SQUID_INTEGRATOR_ID` |
| Modify | `frontend/src/queries/beneficiaries.graphql` | Add filtered query for active count |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install npm packages**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend
npm install @0xsquid/widget canvas-confetti
npm install -D @types/canvas-confetti
```

- [ ] **Step 2: Verify installation**

Run: `cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend && npm ls @0xsquid/widget canvas-confetti`

Expected: Both packages listed without errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: add @0xsquid/widget and canvas-confetti dependencies"
```

---

## Task 2: Environment Configuration

**Files:**
- Modify: `frontend/.env`
- Modify: `frontend/.env.example`
- Modify: `frontend/src/constants/index.ts`

- [ ] **Step 1: Add env variable to `.env`**

Add to `frontend/.env`:
```
VITE_SQUID_INTEGRATOR_ID=squid-swap-widget
```

Note: `squid-swap-widget` is the default test integrator ID. Replace with a real one from https://studio.squidrouter.com/ when going to production.

- [ ] **Step 2: Document in `.env.example`**

Add to `frontend/.env.example`:
```
# Squid Router Widget
VITE_SQUID_INTEGRATOR_ID=squid-swap-widget
```

- [ ] **Step 3: Commit**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies
git add frontend/.env.example
git commit -m "feat: add Squid integrator ID env config"
```

Note: Do NOT commit `.env` — only `.env.example`.

---

## Task 3: SwapWidget Component

**Files:**
- Create: `frontend/src/components/pages/main/SwapWidget.tsx`

- [ ] **Step 1: Create the SwapWidget component**

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { CCOP_CONTRACT_ADDRESS } from '@/constants';

const SQUID_INTEGRATOR_ID = import.meta.env.VITE_SQUID_INTEGRATOR_ID || 'squid-swap-widget';
const CELO_CHAIN_ID = '42220';

interface SwapWidgetProps {
  onTransactionComplete?: () => void;
}

function SwapWidgetInner({ onTransactionComplete }: SwapWidgetProps) {
  // Dynamic import to handle potential load failures
  // The SquidWidget is a heavy component, we lazy-load it
  const { SquidWidget } = require('@0xsquid/widget');

  return (
    <SquidWidget
      config={{
        integratorId: SQUID_INTEGRATOR_ID,
        apiUrl: 'https://apiplus.squidrouter.com',
        initialAssets: {
          to: {
            address: CCOP_CONTRACT_ADDRESS,
            chainId: CELO_CHAIN_ID,
          },
        },
        availableChains: {
          destination: [CELO_CHAIN_ID],
        },
        availableTokens: {
          destination: {
            [CELO_CHAIN_ID]: [CCOP_CONTRACT_ADDRESS],
          },
        },
        themeType: 'dark',
      }}
    />
  );
}

// Error boundary fallback
function SwapWidgetFallback() {
  return (
    <div className="p-6 text-center rounded-lg border border-white/20 bg-white/5">
      <p className="text-gray-300 mb-3">No se pudo cargar el widget de intercambio.</p>
      <p className="text-sm text-gray-400">
        Puedes obtener COPm directamente en{' '}
        <a
          href="https://app.squidrouter.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Squid Router
        </a>
        {' '}o{' '}
        <a
          href="https://app.uniswap.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Uniswap
        </a>
      </p>
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class SwapWidgetErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SwapWidget error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <SwapWidgetFallback />;
    }
    return this.props.children;
  }
}

export default function SwapWidget(props: SwapWidgetProps) {
  return (
    <SwapWidgetErrorBoundary>
      <SwapWidgetInner {...props} />
    </SwapWidgetErrorBoundary>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend && npx tsc --noEmit`

If `@0xsquid/widget` has no types, add a declaration file at `frontend/src/types/squid.d.ts`:
```ts
declare module '@0xsquid/widget' {
  export const SquidWidget: React.FC<{ config: Record<string, any> }>;
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies
git add frontend/src/components/pages/main/SwapWidget.tsx
git add frontend/src/types/squid.d.ts 2>/dev/null  # only if created
git commit -m "feat: add SwapWidget component with Squid integration and error boundary"
```

---

## Task 4: QuickAmountPicker Component

**Files:**
- Create: `frontend/src/components/pages/main/QuickAmountPicker.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Button } from '@/components/ui/button';

const QUICK_AMOUNTS = [
  { label: '10K', value: '10000' },
  { label: '50K', value: '50000' },
  { label: '100K', value: '100000' },
  { label: '500K', value: '500000' },
];

interface QuickAmountPickerProps {
  selectedAmount: string;
  onSelect: (amount: string) => void;
}

export default function QuickAmountPicker({ selectedAmount, onSelect }: QuickAmountPickerProps) {
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
              : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
          }`}
          onClick={() => onSelect(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies
git add frontend/src/components/pages/main/QuickAmountPicker.tsx
git commit -m "feat: add QuickAmountPicker component for preset donation amounts"
```

---

## Task 5: DonationProgress Component

**Files:**
- Create: `frontend/src/components/pages/main/DonationProgress.tsx`

- [ ] **Step 1: Create the step progress indicator**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies
git add frontend/src/components/pages/main/DonationProgress.tsx
git commit -m "feat: add DonationProgress step indicator component"
```

---

## Task 6: DonationStats Component

**Files:**
- Create: `frontend/src/components/pages/main/DonationStats.tsx`

This component queries the subgraph for total donated and active beneficiary count.

- [ ] **Step 1: Create the component**

```tsx
import { useQuery } from '@tanstack/react-query';
import { getBuiltGraphSDK } from '@/../.graphclient';
import { formatUnits } from 'viem';
import { Users, Heart } from 'lucide-react';

const sdk = getBuiltGraphSDK();

export default function DonationStats() {
  const { data: fundsData } = useQuery({
    queryKey: ['Funds'],
    queryFn: () => sdk.Funds(),
  });

  const { data: beneficiariesData } = useQuery({
    queryKey: ['Beneficiaries'],
    queryFn: () => sdk.Beneficiaries(),
  });

  const totalSupplied = fundsData?.funds_collection[0]?.totalSupplied;
  const activeBeneficiaries = beneficiariesData?.beneficiaries.filter(
    (b: { isActive: boolean }) => b.isActive
  ).length ?? 0;

  const formattedTotal = totalSupplied
    ? new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(formatUnits(totalSupplied, 18)))
    : '...';

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
        <Heart className="w-5 h-5 text-pink-400 shrink-0" />
        <div>
          <p className="text-xs text-gray-400">Total donado</p>
          <p className="text-sm font-bold text-white">{formattedTotal} cCOP</p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
        <Users className="w-5 h-5 text-blue-400 shrink-0" />
        <div>
          <p className="text-xs text-gray-400">Beneficiarios</p>
          <p className="text-sm font-bold text-white">{activeBeneficiaries}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies
git add frontend/src/components/pages/main/DonationStats.tsx
git commit -m "feat: add DonationStats component with subgraph data"
```

---

## Task 7: DonationReceipt Component

**Files:**
- Create: `frontend/src/components/pages/main/DonationReceipt.tsx`

- [ ] **Step 1: Create the thank-you receipt component**

```tsx
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { ExternalLink, Share2, ArrowLeft } from 'lucide-react';
import { formatUnits } from 'viem';

interface DonationReceiptProps {
  amount: bigint;
  txHash: string;
  onReset: () => void;
}

export default function DonationReceipt({ amount, txHash, onReset }: DonationReceiptProps) {
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  const formattedAmount = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(formatUnits(amount, 18)));

  const celoscanUrl = `https://celoscan.io/tx/${txHash}`;

  const shareText = `Acabo de donar ${formattedAmount} cCOP al programa de subsidios de ReFi Colombia! ${celoscanUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="text-4xl">🎉</div>
      <h3 className="text-xl font-bold text-white">Donacion exitosa!</h3>
      <p className="text-gray-300">
        Donaste <span className="font-bold text-white">{formattedAmount} cCOP</span> al programa de subsidios.
      </p>

      <div className="flex flex-col gap-2 w-full">
        <a
          href={celoscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300"
        >
          <ExternalLink className="w-4 h-4" />
          Ver en Celoscan
        </a>

        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            type="button"
            variant="outline"
            className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartir en X
          </Button>
        </a>

        <Button
          type="button"
          variant="ghost"
          className="text-gray-400 hover:text-white"
          onClick={onReset}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Hacer otra donacion
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies
git add frontend/src/components/pages/main/DonationReceipt.tsx
git commit -m "feat: add DonationReceipt component with confetti and share"
```

---

## Task 8: Rewrite UserFundsCard

**Files:**
- Rewrite: `frontend/src/components/pages/main/UserFundsCard.tsx`

This is the main orchestrator. It replaces the entire existing component.

- [ ] **Step 1: Rewrite UserFundsCard.tsx**

```tsx
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CCOP_CONTRACT_ADDRESS,
  SUBSIDY_CONTRACT_ABI,
  SUBSIDY_CONTRACT_ADDRESS,
  DIVVI_CONSUMER_ADDRESS,
} from '@/constants';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { erc20Abi, parseUnits, formatUnits } from 'viem';
import { getReferralTag, submitReferral } from '@divvi/referral-sdk';
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from 'wagmi';
import SwapWidget from './SwapWidget';
import QuickAmountPicker from './QuickAmountPicker';
import DonationProgress, { type DonationStep } from './DonationProgress';
import DonationReceipt from './DonationReceipt';
import DonationStats from './DonationStats';

function UserFundsCard() {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const client = usePublicClient();

  const [selectedAmount, setSelectedAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [donationStep, setDonationStep] = useState<DonationStep>('idle');
  const [showSwapWidget, setShowSwapWidget] = useState(false);
  const [receiptData, setReceiptData] = useState<{ amount: bigint; txHash: string } | null>(null);

  const {
    writeContractAsync,
    isPending,
  } = useWriteContract({
    mutation: {
      onError: (error) => {
        console.error(error);
        setDonationStep('idle');
        toast({
          title: 'Error en la transaccion',
          description: error.message,
          variant: 'destructive',
        });
      },
    },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: CCOP_CONTRACT_ADDRESS,
    functionName: 'allowance',
    args: [address!, SUBSIDY_CONTRACT_ADDRESS],
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    abi: erc20Abi,
    address: CCOP_CONTRACT_ADDRESS,
    functionName: 'balanceOf',
    args: [address!],
  });

  const hasBalance = balance !== undefined && balance > 0n;
  const activeAmount = selectedAmount || customAmount;

  const handleQuickSelect = (amount: string) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount('');
  };

  const handleSwapComplete = () => {
    refetchBalance();
  };

  const handleDonate = async () => {
    if (!activeAmount) return;

    try {
      const amount = parseUnits(activeAmount, 18);
      refetchAllowance();

      if (typeof allowance !== 'bigint') return;

      // Step 1: Approve if needed
      if (allowance < amount) {
        setDonationStep('approving');

        const approveTx = await writeContractAsync({
          abi: erc20Abi,
          address: CCOP_CONTRACT_ADDRESS,
          functionName: 'approve',
          args: [SUBSIDY_CONTRACT_ADDRESS, amount],
        });

        toast({
          title: 'Aprobacion enviada',
          description: 'Esperando confirmacion...',
        });

        const receipt = await client!.waitForTransactionReceipt({
          hash: approveTx,
          confirmations: 1,
          pollingInterval: 1000,
          timeout: 60000,
        });

        if (receipt.status === 'reverted') {
          setDonationStep('idle');
          toast({
            title: 'Error en la aprobacion',
            description: 'La transaccion de aprobacion fallo.',
            variant: 'destructive',
          });
          return;
        }

        await refetchAllowance();
      }

      // Step 2: Donate
      setDonationStep('donating');

      const referralTag = getReferralTag({
        user: (address as `0x${string}`) ?? '0x0000000000000000000000000000000000000000',
        consumer: DIVVI_CONSUMER_ADDRESS,
      });

      const addFundsTx = await writeContractAsync({
        abi: SUBSIDY_CONTRACT_ABI,
        address: SUBSIDY_CONTRACT_ADDRESS,
        functionName: 'addFunds',
        args: [amount],
        dataSuffix: `0x${referralTag}`,
      });

      const donateReceipt = await client!.waitForTransactionReceipt({
        hash: addFundsTx,
        confirmations: 1,
        pollingInterval: 1000,
        timeout: 60000,
      });

      if (donateReceipt.status === 'reverted') {
        setDonationStep('idle');
        toast({
          title: 'Error al donar',
          description: 'La transaccion de donacion fallo.',
          variant: 'destructive',
        });
        return;
      }

      // Step 3: Done
      setDonationStep('done');
      setReceiptData({ amount, txHash: addFundsTx });
      refetchBalance();

      submitReferral({ txHash: addFundsTx, chainId: 42220 }).catch((e) =>
        console.warn('Divvi submitReferral failed', e)
      );
    } catch (error: any) {
      console.error(error);
      setDonationStep('idle');
      toast({
        title: 'Error al donar fondos',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    setDonationStep('idle');
    setReceiptData(null);
    setSelectedAmount('');
    setCustomAmount('');
    refetchBalance();
  };

  // Show receipt screen after successful donation
  if (receiptData) {
    return (
      <Card className="w-full">
        <DonationReceipt
          amount={receiptData.amount}
          txHash={receiptData.txHash}
          onReset={handleReset}
        />
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-white text-lg font-semibold">Donar fondos</CardTitle>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-0 space-y-4">
        {/* Donation Stats */}
        <DonationStats />

        {/* Balance Display */}
        {isConnected && balance !== undefined && (
          <div className="p-3 bg-white/10 rounded-lg border border-white/20 text-center">
            <p className="text-gray-300 text-xs mb-1">Tu balance</p>
            <p className="text-white text-lg font-bold">
              {new Intl.NumberFormat('es-CO', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(Number(formatUnits(balance, 18)))} cCOP
            </p>
          </div>
        )}

        {/* Swap Widget Section */}
        {isConnected && !hasBalance ? (
          // No COPm balance — show swap widget prominently
          <div className="space-y-3">
            <p className="text-sm text-gray-300 text-center">
              No tienes COPm. Intercambia cualquier token para obtener COPm:
            </p>
            <SwapWidget onTransactionComplete={handleSwapComplete} />
          </div>
        ) : isConnected ? (
          // Has COPm — collapsible swap widget
          <>
            <button
              type="button"
              className="flex items-center justify-center gap-1 w-full text-sm text-gray-400 hover:text-gray-200 transition-colors"
              onClick={() => setShowSwapWidget(!showSwapWidget)}
            >
              {showSwapWidget ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              Necesitas mas COPm?
            </button>
            {showSwapWidget && (
              <SwapWidget onTransactionComplete={handleSwapComplete} />
            )}
          </>
        ) : null}

        {/* Quick Amount Picker */}
        {isConnected && hasBalance && (
          <>
            <QuickAmountPicker
              selectedAmount={selectedAmount}
              onSelect={handleQuickSelect}
            />

            {/* Custom Amount Input */}
            <Input
              placeholder="Cantidad personalizada"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              className="bg-background text-white border-border text-center"
            />

            {/* Progress Indicator */}
            <DonationProgress currentStep={donationStep} />

            {/* Donate Button */}
            <Button
              disabled={!activeAmount || isPending || donationStep !== 'idle'}
              className="w-full text-white rounded-lg"
              onClick={handleDonate}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Donar{activeAmount ? ` ${Number(activeAmount).toLocaleString('es-CO')} cCOP` : ''}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default UserFundsCard;
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend && npm run build`

Expected: Build succeeds without errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies
git add frontend/src/components/pages/main/UserFundsCard.tsx
git commit -m "feat: rewrite UserFundsCard with Squid widget, quick-pick amounts, progress, and receipt"
```

---

## Task 9: Dev Server Verification

- [ ] **Step 1: Start dev server and verify visually**

Run: `cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend && npm run dev`

Verify:
1. Page loads without console errors
2. Donation stats section shows total donated + beneficiary count
3. Without wallet connected: card shows title only
4. With wallet connected + 0 COPm: Squid widget shown prominently
5. With wallet connected + COPm balance: quick-pick buttons + input shown, "Necesitas mas COPm?" toggle works
6. Quick-pick buttons highlight when selected
7. Custom amount clears quick-pick selection and vice versa

- [ ] **Step 2: Test donation flow (if testable)**

If on mainnet with COPm:
1. Select an amount or enter custom
2. Click Donar
3. Approve tx in wallet
4. Progress indicator shows steps
5. After success: receipt screen with confetti, share button, Celoscan link
6. "Hacer otra donacion" resets the flow

---

## Task 10: Final Build Check and Commit

- [ ] **Step 1: Full production build**

Run: `cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend && npm run build`

Expected: Build succeeds. Note any chunk size warnings.

- [ ] **Step 2: Final commit if any remaining changes**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies
git status
# If any remaining unstaged changes:
git add -A
git commit -m "chore: final build verification for enhanced donation experience"
```
