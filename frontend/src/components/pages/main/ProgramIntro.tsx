import { useTranslation } from 'react-i18next'

// Opening section of the public page: what the program is.
export function ProgramIntro() {
  const { t } = useTranslation('main')
  const tags = [t('heroTagCOPm'), t('heroTagCelo'), t('heroTagOnchain')]

  return (
    <section className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
        {t('heroEyebrow')}
      </p>
      <h1 className="mt-3 text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl">
        {t('heroTitle')}
      </h1>
      <div className="mx-auto mt-5 max-w-2xl space-y-3 text-pretty text-base leading-relaxed text-muted-foreground">
        <p>{t('programDescription1')}</p>
        <p>{t('programDescription2')}</p>
      </div>
      <ul className="mt-6 flex flex-wrap justify-center gap-2">
        {tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full border border-brand-800 bg-brand-900/40 px-3 py-1 text-xs font-medium text-brand-200"
          >
            {tag}
          </li>
        ))}
      </ul>
    </section>
  )
}
