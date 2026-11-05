import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { useIsAdmin } from '@/hooks/useIsAdmin'

import { Button } from '../ui/button'
import { LanguageToggle } from './LanguageToggle'

export function NavBar() {
  const { t } = useTranslation('common')
  const { isAdmin } = useIsAdmin()

  const location = useLocation()

  return (
    <div className="m-0 p-0">
      <nav className="w-full border-b px-4 py-3">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 items-center gap-3 sm:gap-8">
            <span className="whitespace-nowrap font-bold">ReFi Colombia</span>
            {isAdmin &&
              (location.pathname == '/admin' ? (
                <Link to="/">
                  <Button size="sm">{t('userPanel')}</Button>
                </Link>
              ) : (
                <Link to="/admin">
                  <Button size="sm">{t('adminPanel')}</Button>
                </Link>
              ))}
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <appkit-button />
          </div>
        </div>
      </nav>
    </div>
  )
}
