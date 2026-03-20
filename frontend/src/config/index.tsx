import type { AppKitNetwork } from '@reown/appkit/networks'
import { celo } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

export const projectId = import.meta.env.VITE_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const metadata = {
  name: 'Subsidios ReFi Colombia',
  description: 'Subsidios ReFi Colombia module',
  url: 'https://subsidios.refimcolombia.org',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
}

export const networks = [celo] as [AppKitNetwork, ...AppKitNetwork[]]

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
})

export const config = wagmiAdapter.wagmiConfig
