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
  ...generalConfig,
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
