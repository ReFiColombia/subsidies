import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { useIsAdmin } from '@/hooks/useIsAdmin'

import { Button } from '../ui/button'
import { LanguageToggle } from './LanguageToggle'

const MAIN_SITE = 'https://reficolombia.org'

export function NavBar() {
  const { t } = useTranslation('common')
  const { isAdmin } = useIsAdmin()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[#0e1220]/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 md:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <a
            href={MAIN_SITE}
            className="flex items-center"
            aria-label="ReFi Colombia"
          >
            <img
              src="/refi-colombia-logo.png"
              alt="ReFi Colombia"
              className="h-8 w-auto sm:h-9"
            />
          </a>
          <span className="h-5 w-px bg-[var(--line-strong)]" aria-hidden />
          <Link
            to="/"
            className="whitespace-nowrap font-display text-lg text-foreground"
          >
            {t('appName')}
          </Link>
          {isAdmin &&
            (location.pathname == '/admin' ? (
              <Link to="/">
                <Button size="sm" variant="outline">
                  {t('userPanel')}
                </Button>
              </Link>
            ) : (
              <Link to="/admin">
                <Button size="sm" variant="outline">
                  {t('adminPanel')}
                </Button>
              </Link>
            ))}
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          <appkit-button balance="hide" />
        </div>
      </nav>
    </header>
  )
}
