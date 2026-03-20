import { useAppKitAccount } from '@reown/appkit/react'
import { Link, useLocation } from 'react-router'
import { useReadContract } from 'wagmi'

import { SUBSIDY_CONTRACT_ABI,SUBSIDY_CONTRACT_ADDRESS } from '@/constants'

import { Button } from '../ui/button'

export function NavBar() {
  const { isConnected, address } = useAppKitAccount()
  const { data } = useReadContract({
    address: SUBSIDY_CONTRACT_ADDRESS,
    abi: SUBSIDY_CONTRACT_ABI,
    functionName: 'owner',
  })

  const isAdmin = isConnected && data && address && data === address

  const location = useLocation()

  return (
    <div className="m-0 h-16 p-0">
      <nav className="w-full border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <span className="font-bold">ReFi Colombia</span>
            {isAdmin &&
              (location.pathname == '/admin' ? (
                <Link to="/">
                  <Button>User Panel</Button>
                </Link>
              ) : (
                <Link to="/admin">
                  <Button>Admin Panel</Button>
                </Link>
              ))}
          </div>
          <appkit-button />
        </div>
      </nav>
    </div>
  )
}
