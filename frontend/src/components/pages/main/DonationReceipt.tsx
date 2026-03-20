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
    <div className="flex flex-col items-center gap-4 py-6 px-6 text-center">
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
