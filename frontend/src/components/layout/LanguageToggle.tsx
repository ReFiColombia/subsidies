import { useTranslation } from 'react-i18next'

// Same pill toggle as reficolombia.org.
export function LanguageToggle() {
  const { i18n } = useTranslation()
  const current = i18n.language === 'es' ? 'es' : 'en'

  return (
    <div className="flex items-center rounded-full border border-[var(--line)] p-0.5 text-xs font-medium">
      {(['es', 'en'] as const).map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => i18n.changeLanguage(lng)}
          aria-pressed={current === lng}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
            current === lng
              ? 'bg-white/10 text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {lng}
        </button>
      ))}
    </div>
  )
}
