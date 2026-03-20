import { Component, type ErrorInfo, type ReactNode } from 'react';
import { SquidWidget } from '@0xsquid/widget';
import { CCOP_CONTRACT_ADDRESS } from '@/constants';

const SQUID_INTEGRATOR_ID = import.meta.env.VITE_SQUID_INTEGRATOR_ID || 'squid-swap-widget';
const CELO_CHAIN_ID = '42220';

interface SwapWidgetProps {
  onTransactionComplete?: () => void;
}

function SwapWidgetInner(_props: SwapWidgetProps) {
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
