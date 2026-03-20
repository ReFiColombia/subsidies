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
