import { useAppKitAccount } from '@reown/appkit/react';
import { useReadContract } from 'wagmi';
import { Button } from '../ui/button';
import { Link, useLocation } from 'react-router';
import { SUBSIDY_CONTRACT_ADDRESS, SUBSIDY_CONTRACT_ABI } from '@/constants';

export function NavBar() {
  const { isConnected, address } = useAppKitAccount();
  const { data } = useReadContract({
            address: SUBSIDY_CONTRACT_ADDRESS,
        abi: SUBSIDY_CONTRACT_ABI,
    functionName: 'owner',
  });

  const isAdmin = isConnected && data && address && data === address;

  const location = useLocation();

  return (
    <div className='p-0 m-0 h-16'>
      <nav className='border-b p-4 w-full'>
        <div className='container mx-auto flex items-center justify-between'>
          <div className='flex items-center space-x-8'>
            <span className='font-bold'>ReFi Colombia</span>
            {isAdmin &&
              (location.pathname == '/admin' ? (
                <Link to='/'>
                  <Button>User Panel</Button>
                </Link>
              ) : (
                <Link to='/admin'>
                  <Button>Admin Panel</Button>
                </Link>
              ))}
          </div>
          <appkit-button />
        </div>
      </nav>
    </div>
  );
}
