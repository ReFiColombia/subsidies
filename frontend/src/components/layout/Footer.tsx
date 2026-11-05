import { useTranslation } from 'react-i18next'

const MAIN_SITE = 'https://reficolombia.org'

export function Footer() {
  const { t } = useTranslation('common')

  return (
    <footer className="border-t border-[var(--line)] py-10">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-4 px-4 text-center md:flex-row md:justify-between md:px-8 md:text-left">
        <div className="flex items-center gap-3">
          <img
            src="/refi-colombia-logo.png"
            alt="ReFi Colombia"
            className="h-7 w-auto"
          />
          <p className="text-sm text-muted-foreground">{t('footerTagline')}</p>
        </div>
        <a
          href={MAIN_SITE}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          reficolombia.org
        </a>
      </div>
    </footer>
  )
}
