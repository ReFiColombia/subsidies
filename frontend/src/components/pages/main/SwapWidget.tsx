import { Component, type ErrorInfo, type ReactNode } from 'react';
import { SquidWidget } from '@0xsquid/widget';
import { CCOP_CONTRACT_ADDRESS } from '@/constants';

const CELO_CHAIN_ID = '42220';

const SQUID_THEME = {
  borderRadius: {
    'button-lg-primary': '3.75rem',
    'button-lg-secondary': '3.75rem',
    'button-lg-tertiary': '3.75rem',
    'button-md-primary': '1.25rem',
    'button-md-secondary': '1.25rem',
    'button-md-tertiary': '1.25rem',
    'button-sm-primary': '1.25rem',
    'button-sm-secondary': '1.25rem',
    'button-sm-tertiary': '1.25rem',
    container: '1.875rem',
    input: '9999px',
    'menu-sm': '0.9375rem',
    'menu-lg': '1.25rem',
    modal: '1.875rem',
  },
  fontSize: {
    caption: '0.875rem',
    'body-small': '1.14375rem',
    'body-medium': '1.40625rem',
    'body-large': '1.75625rem',
    'heading-small': '2.1875rem',
    'heading-medium': '3.08125rem',
    'heading-large': '4.40625rem',
  },
  fontWeight: {
    caption: '400',
    'body-small': '400',
    'body-medium': '400',
    'body-large': '400',
    'heading-small': '400',
    'heading-medium': '400',
    'heading-large': '400',
  },
  fontFamily: {
    'squid-main': 'GeistVariable, sans-serif',
  },
  boxShadow: {
    container: '0px 2px 4px 0px rgba(0, 0, 0, 0.20), 0px 5px 50px -1px rgba(0, 0, 0, 0.33)',
  },
  color: {
    'grey-100': '#FBFBFD',
    'grey-200': '#EDEFF3',
    'grey-300': '#D1D6E0',
    'grey-400': '#A7ABBE',
    'grey-500': '#8A8FA8',
    'grey-600': '#676B7E',
    'grey-700': '#4C515D',
    'grey-800': '#292C32',
    'grey-900': '#17191C',
    'royal-300': '#D9BEF4',
    'royal-400': '#B893EC',
    'royal-500': '#9E79D2',
    'royal-600': '#8353C5',
    'royal-700': '#6B45A1',
    'status-positive': '#7AE870',
    'status-negative': '#FF4D5B',
    'status-partial': '#F3AF25',
    'highlight-700': '#E4FE53',
    'animation-bg': '#9E79D2',
    'animation-text': '#FBFBFD',
    'button-lg-primary-bg': '#9E79D2',
    'button-lg-primary-text': '#FBFBFD',
    'button-lg-secondary-bg': '#FBFBFD',
    'button-lg-secondary-text': '#292C32',
    'button-lg-tertiary-bg': '#292C32',
    'button-lg-tertiary-text': '#D1D6E0',
    'button-md-primary-bg': '#9E79D2',
    'button-md-primary-text': '#FBFBFD',
    'button-md-secondary-bg': '#FBFBFD',
    'button-md-secondary-text': '#292C32',
    'button-md-tertiary-bg': '#292C32',
    'button-md-tertiary-text': '#D1D6E0',
    'button-sm-primary-bg': '#9E79D2',
    'button-sm-primary-text': '#FBFBFD',
    'button-sm-secondary-bg': '#FBFBFD',
    'button-sm-secondary-text': '#292C32',
    'button-sm-tertiary-bg': '#292C32',
    'button-sm-tertiary-text': '#D1D6E0',
    'input-bg': '#17191C',
    'input-placeholder': '#676B7E',
    'input-text': '#D1D6E0',
    'input-selection': '#D1D6E0',
    'menu-bg': '#17191CA8',
    'menu-text': '#FBFBFDA8',
    'menu-backdrop': '#FBFBFD1A',
    'modal-backdrop': '#17191C54',
  },
};

interface SwapWidgetProps {
  onTransactionComplete?: () => void;
}

function SwapWidgetInner(_props: SwapWidgetProps) {
  return (
    <SquidWidget
      config={{
        integratorId: 'squid-widget-studio',
        apiUrl: 'https://api.uatsquidrouter.com',
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
        theme: SQUID_THEME,
        themeType: 'dark',
        tabs: {
          swap: true,
          buy: true,
          send: false,
        },
        priceImpactWarnings: {
          warning: 3,
          critical: 5,
        },
        loadPreviousStateFromLocalStorage: true,
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

export function SwapWidget(props: SwapWidgetProps) {
  return (
    <SwapWidgetErrorBoundary>
      <SwapWidgetInner {...props} />
    </SwapWidgetErrorBoundary>
  );
}
