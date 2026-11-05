import { createAppKit } from '@reown/appkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { WagmiProvider } from 'wagmi'

import { metadata, networks, projectId, wagmiAdapter } from '@/config'

const queryClient = new QueryClient()

const generalConfig = {
  projectId,
  metadata,
  networks,
}

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  features: {
    analytics: true,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#5e71f5',
    '--w3m-color-mix': '#0e1220',
    '--w3m-color-mix-strength': 20,
    '--w3m-font-family': 'Outfit, ui-sans-serif, system-ui, sans-serif',
    '--w3m-border-radius-master': '2px',
  },
  ...generalConfig,
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
