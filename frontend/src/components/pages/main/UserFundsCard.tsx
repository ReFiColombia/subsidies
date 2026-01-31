import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CCOP_CONTRACT_ADDRESS,
  SUBSIDY_CONTRACT_ABI,
  SUBSIDY_CONTRACT_ADDRESS,
  DIVVI_CONSUMER_ADDRESS,
} from '@/constants';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { erc20Abi, parseUnits, formatUnits } from 'viem';
import { getReferralTag, submitReferral } from '@divvi/referral-sdk';
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

function UserFundsCard() {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const client = usePublicClient();
  
  // Función para generar enlace de Celoscan
  const getCeloscanUrl = (hash: string) => {
    return `https://celoscan.io/tx/${hash}`;
  };
  const {
    writeContractAsync,
    isPending,
    data: hash,
  } = useWriteContract({
    mutation: {
      onError: (error) => {
        console.error(error);
        toast({
          title: 'Error en la transacción',
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

  const { data: balance } = useReadContract({
    abi: erc20Abi,
    address: CCOP_CONTRACT_ADDRESS,
    functionName: 'balanceOf',
    args: [address!],
  });

  const { isLoading } = useWaitForTransactionReceipt({ hash });

  const handleAddSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    try {
      refetchAllowance();

      const formData = new FormData(evt.currentTarget);
      const amount = parseUnits(formData.get('amount') as string, 18);
      if (typeof allowance !== 'bigint') return;
      if (allowance < amount) {
        const approveTx = await writeContractAsync({
          abi: erc20Abi,
          address: CCOP_CONTRACT_ADDRESS,
          functionName: 'approve',
          args: [SUBSIDY_CONTRACT_ADDRESS, amount],
        });

        toast({
          title: '⏳ Aprobación enviada',
          description: (
            <div className="space-y-2">
              <p>Esperando confirmación de la aprobación...</p>
                          <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Hash:</span>
              <a 
                href={getCeloscanUrl(approveTx)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-blue-600 hover:text-blue-800 hover:bg-gray-200 transition-colors"
              >
                {approveTx.slice(0, 10)}...{approveTx.slice(-8)}
              </a>
            </div>
            </div>
          ),
          duration: 5000,
        });

        await refetchAllowance();

        const receipt = await client!.waitForTransactionReceipt({
          hash: approveTx,
          confirmations: 1,
          pollingInterval: 1000,
          timeout: 60000,
        });
        if (receipt.status === 'reverted') {
          toast({
            title: '❌ Error en la aprobación',
            description: (
              <div className="space-y-2">
                <p>La transacción de aprobación falló.</p>
                <p className="text-xs text-gray-500">
                  Verifica que tengas suficiente gas y que tu wallet esté conectada.
                </p>
              </div>
            ),
            variant: 'destructive',
            duration: 10000,
          });
          return;
        }
      }
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

      toast({
        title: '🎉 ¡Fondos donados exitosamente!',
        description: (
          <div className="space-y-2">
            <p>Tu donación ha sido procesada correctamente.</p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Hash:</span>
              <a 
                href={getCeloscanUrl(addFundsTx)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-blue-600 hover:text-blue-800 hover:bg-gray-200 transition-colors"
              >
                {addFundsTx.slice(0, 10)}...{addFundsTx.slice(-8)}
              </a>
            </div>
          </div>
        ),
        duration: 8000,
      });

      // Report to Divvi
      submitReferral({ txHash: addFundsTx, chainId: 42220 }).catch((e) =>
        console.warn('Divvi submitReferral failed', e)
      );
    } catch (error: any) {
      console.error(error);
      toast({
        title: '❌ Error al donar fondos',
        description: (
          <div className="space-y-2">
            <p className="text-sm">{error.message}</p>
            <p className="text-xs text-gray-500">
              Verifica que tengas suficiente gas y tokens para donar.
            </p>
          </div>
        ),
        variant: 'destructive',
        duration: 10000,
      });
    }
  };

  return (
    <Card className='w-full'>
      <form onSubmit={handleAddSubmit}>
        <CardHeader className='text-center pb-4'>
          <CardTitle className='text-white text-lg font-semibold'>Donar fondos</CardTitle>
        </CardHeader>
        <CardContent className='px-6 pb-4 pt-0'>
          {isConnected && balance !== undefined && (
            <div className='mb-4 p-3 bg-white/10 rounded-lg border border-white/20'>
              <p className='text-gray-300 text-xs mb-1 text-center'>Tu balance</p>
              <p className='text-white text-lg font-bold text-center'>
                {new Intl.NumberFormat('es-CO', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(Number(formatUnits(balance, 18)))} cCOP
              </p>
            </div>
          )}
          <Label className='text-gray-200 mb-3 block text-center'>Cantidad</Label>
          <Input name='amount' placeholder='$cCop' className='bg-background text-white border-border text-center' />
        </CardContent>
        <CardFooter className='px-6 pb-6 pt-2'>
          <Button disabled={isPending || isLoading || !isConnected} className='w-full text-white rounded-lg'>
            {(isPending || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Donar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default UserFundsCard; 
