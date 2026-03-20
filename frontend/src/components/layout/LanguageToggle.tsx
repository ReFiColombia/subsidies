import { useTranslation } from 'react-i18next'

export function LanguageToggle() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className={i18n.language === 'en' ? 'font-bold text-foreground' : ''}>
        EN
      </span>
      <span>|</span>
      <span className={i18n.language === 'es' ? 'font-bold text-foreground' : ''}>
        ES
      </span>
    </button>
  )
}
