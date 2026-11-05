import { SquidWidget } from '@0xsquid/widget'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

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
    'squid-main': 'Outfit, system-ui, sans-serif',
  },
  boxShadow: {
    container: '0px 2px 8px 0px rgba(0, 0, 0, 0.3)',
  },
  color: {
    'grey-100': '#EEF1F8',
    'grey-200': '#CFC9F2',
    'grey-300': '#9AA6C0',
    'grey-400': '#6F92F7',
    'grey-500': '#5E71F5',
    'grey-600': '#4A5BD8',
    'grey-700': '#1C2438',
    'grey-800': '#151B2C',
    'grey-900': '#0E1220',
    'royal-300': '#9AA6C0',
    'royal-400': '#6F92F7',
    'royal-500': '#6F92F7',
    'royal-600': '#5E71F5',
    'royal-700': '#4A5BD8',
    'status-positive': '#7AE870',
    'status-negative': '#FF4D5B',
    'status-partial': '#F3AF25',
    'highlight-700': '#9AA6C0',
    'animation-bg': '#5E71F5',
    'animation-text': '#EEF1F8',
    'button-lg-primary-bg': '#5E71F5',
    'button-lg-primary-text': '#EEF1F8',
    'button-lg-secondary-bg': '#EEF1F8',
    'button-lg-secondary-text': '#151B2C',
    'button-lg-tertiary-bg': '#151B2C',
    'button-lg-tertiary-text': '#9AA6C0',
    'button-md-primary-bg': '#5E71F5',
    'button-md-primary-text': '#EEF1F8',
    'button-md-secondary-bg': '#EEF1F8',
    'button-md-secondary-text': '#151B2C',
    'button-md-tertiary-bg': '#151B2C',
    'button-md-tertiary-text': '#9AA6C0',
    'button-sm-primary-bg': '#5E71F5',
    'button-sm-primary-text': '#EEF1F8',
    'button-sm-secondary-bg': '#EEF1F8',
    'button-sm-secondary-text': '#151B2C',
    'button-sm-tertiary-bg': '#151B2C',
    'button-sm-tertiary-text': '#9AA6C0',
    'input-bg': '#0E1220',
    'input-placeholder': '#4A5BD8',
    'input-text': '#CFC9F2',
    'input-selection': '#9AA6C0',
    'menu-bg': '#0E1220A8',
    'menu-text': '#EEF1F8A8',
    'menu-backdrop': '#EEF1F81A',
    'modal-backdrop': '#0E122054',
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
  const { t } = useTranslation('main')
  return (
    <div className="rounded-lg border border-border bg-muted p-6 text-center">
      <p className="mb-3 text-foreground">{t('swapWidgetError')}</p>
      <p className="text-sm text-muted-foreground">
        {t('getCOPmDirectly')}{' '}
        <a
          href="https://app.squidrouter.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-400 underline hover:text-brand-300"
        >
          Squid Router
        </a>{' '}
        {t('or')}{' '}
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
