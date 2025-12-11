import { secondsToDays } from '@/utils';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/button';

type HeaderProps = {
  isWhiteListed: boolean;
  isAbleToClaim: boolean;
  lastClaimed: bigint;
  claimInterval: bigint;
  valueToClaim: bigint;
};

function Header({
  isWhiteListed,
  isAbleToClaim,
  lastClaimed,
  claimInterval,
  valueToClaim,
}: HeaderProps) {
  const getHeaderMessage = () => {
    if (!isWhiteListed) {
      return (
        <div className="space-y-6 text-center">
          <div className="text-base text-gray-200 leading-relaxed">
            <p className="mb-3">
              El Programa de Subsidios ReFi Colombia es una iniciativa que proporciona subsidios periódicos en cCOP
              (Celo Colombian Peso) a beneficiarios elegibles en la red Celo.
            </p>
            <p>
              Los beneficiarios pueden reclamar su subsidio cada cierto intervalo de tiempo, contribuyendo así
              a la inclusión financiera y el acceso a servicios descentralizados.
            </p>
          </div>
          <div className="text-xl font-bold text-white bg-gradient-to-r from-purple-500 to-purple-700 p-4 rounded-lg">
            Lo sentimos, aún no eres beneficiario
          </div>
          <Button variant='link' asChild className="text-base">
            <a target='_blank' href='https://tinyurl.com/ReFiMedUBIRequest'>
              Registrate aquí
            </a>
          </Button>
        </div>
      );
    } else if (isAbleToClaim) {
      return (
        <div className="text-xl font-semibold text-white text-center">
          Monto disponible para reclamar: {new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(Number(formatUnits(valueToClaim, 18)))} cCOP
        </div>
      );
    } else {
      const secondsSinceLastClaimed = Date.now() / 1000 - Number(lastClaimed);
      const daysLeft = secondsToDays(
        Number(claimInterval) - secondsSinceLastClaimed
      );
      return (
        <div className="text-center">
          <div className="text-lg font-semibold text-white">
            Ya reclamaste el subsidio de esta semana.
          </div>
          <div className="text-sm text-gray-300 mt-2">
            Regresa en {daysLeft} días para reclamar de nuevo.
          </div>
        </div>
      );
    }
  };

  return <div className='w-full'>{getHeaderMessage()}</div>;
}

export default Header;
