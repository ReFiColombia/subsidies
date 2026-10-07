import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Whether the connected wallet is a program admin. The backend decides: the
// owner of the SubsidyProgram contract, plus any wallet in ADMIN_ADDRESSES.
export const useIsAdmin = () => {
  const { address, isConnected } = useAccount()

  const query = useQuery({
    queryKey: ['is-admin', address?.toLowerCase()],
    queryFn: async (): Promise<boolean> => {
      const response = await fetch(`${API_BASE_URL}/api/admin/check/${address}`)
      if (!response.ok) return false
      const data = (await response.json()) as { isAdmin?: boolean }
      return data.isAdmin === true
    },
    enabled: isConnected && !!address,
    staleTime: 5 * 60 * 1000,
  })

  return {
    isConnected,
    isAdmin: query.data === true,
    isLoading: isConnected && query.isLoading,
  }
}
