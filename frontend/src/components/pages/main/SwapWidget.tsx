import { SquidWidget } from '@0xsquid/widget'
import { Component, type ErrorInfo, type ReactNode } from 'react'

import { CCOP_CONTRACT_ADDRESS } from '@/constants'

const CELO_CHAIN_ID = '42220'

const SQUID_THEME = {
  borderRadius: {
    'button-lg-primary': '0.5rem',
    'button-lg-secondary': '0.5rem',
    'button-lg-tertiary': '0.5rem',
    'button-md-primary': '0.5rem',
    'button-md-secondary': '0.5rem',
    'button-md-tertiary': '0.5rem',
    'button-sm-primary': '0.375rem',
    'button-sm-secondary': '0.375rem',
    'button-sm-tertiary': '0.375rem',
    container: '0.75rem',
    input: '0.5rem',
    'menu-sm': '0.375rem',
    'menu-lg': '0.5rem',
    modal: '0.75rem',
  },
  fontSize: {
    caption: '0.75rem',
    'body-small': '0.875rem',
    'body-medium': '1rem',
    'body-large': '1.125rem',
    'heading-small': '1.25rem',
    'heading-medium': '1.5rem',
    'heading-large': '2rem',
  },
  fontWeight: {
    caption: '400',
    'body-small': '400',
    'body-medium': '500',
    'body-large': '500',
    'heading-small': '600',
    'heading-medium': '600',
    'heading-large': '700',
  },
  fontFamily: {
    'squid-main': 'Inter, system-ui, sans-serif',
  },
  boxShadow: {
    container: '0px 2px 8px 0px rgba(0, 0, 0, 0.3)',
  },
  color: {
    'grey-100': '#F5F3FF',
    'grey-200': '#EDE9FE',
    'grey-300': '#C4B5FD',
    'grey-400': '#A78BFA',
    'grey-500': '#7C3AED',
    'grey-600': '#6D28D9',
    'grey-700': '#4C1D95',
    'grey-800': '#2E1065',
    'grey-900': '#1E1033',
    'royal-300': '#C4B5FD',
    'royal-400': '#A78BFA',
    'royal-500': '#8B5CF6',
    'royal-600': '#7C3AED',
    'royal-700': '#6D28D9',
    'status-positive': '#7AE870',
    'status-negative': '#FF4D5B',
    'status-partial': '#F3AF25',
    'highlight-700': '#C4B5FD',
    'animation-bg': '#7C3AED',
    'animation-text': '#F5F3FF',
    'button-lg-primary-bg': '#7C3AED',
    'button-lg-primary-text': '#F5F3FF',
    'button-lg-secondary-bg': '#F5F3FF',
    'button-lg-secondary-text': '#2E1065',
    'button-lg-tertiary-bg': '#2E1065',
    'button-lg-tertiary-text': '#C4B5FD',
    'button-md-primary-bg': '#7C3AED',
    'button-md-primary-text': '#F5F3FF',
    'button-md-secondary-bg': '#F5F3FF',
    'button-md-secondary-text': '#2E1065',
    'button-md-tertiary-bg': '#2E1065',
    'button-md-tertiary-text': '#C4B5FD',
    'button-sm-primary-bg': '#7C3AED',
    'button-sm-primary-text': '#F5F3FF',
    'button-sm-secondary-bg': '#F5F3FF',
    'button-sm-secondary-text': '#2E1065',
    'button-sm-tertiary-bg': '#2E1065',
    'button-sm-tertiary-text': '#C4B5FD',
    'input-bg': '#1E1033',
    'input-placeholder': '#6D28D9',
    'input-text': '#EDE9FE',
    'input-selection': '#C4B5FD',
    'menu-bg': '#1E1033A8',
    'menu-text': '#F5F3FFA8',
    'menu-backdrop': '#F5F3FF1A',
    'modal-backdrop': '#1E103354',
  },
}

interface SwapWidgetProps {
  onTransactionComplete?: () => void
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
  )
}

function SwapWidgetFallback() {
  return (
    <div className="rounded-lg border border-white/20 bg-white/5 p-6 text-center">
      <p className="mb-3 text-gray-300">
        No se pudo cargar el widget de intercambio.
      </p>
      <p className="text-sm text-gray-400">
        Puedes obtener COPm directamente en{' '}
        <a
          href="https://app.squidrouter.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-400 underline hover:text-brand-300"
        >
          Squid Router
        </a>{' '}
        o{' '}
        <a
          href="https://app.uniswap.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-400 underline hover:text-brand-300"
        >
          Uniswap
        </a>
      </p>
    </div>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
}

class SwapWidgetErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SwapWidget error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <SwapWidgetFallback />
    }
    return this.props.children
  }
}

export function SwapWidget(props: SwapWidgetProps) {
  return (
    <SwapWidgetErrorBoundary>
      <SwapWidgetInner {...props} />
    </SwapWidgetErrorBoundary>
  )
}
