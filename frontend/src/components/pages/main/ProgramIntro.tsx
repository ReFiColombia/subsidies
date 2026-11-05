import { useTranslation } from 'react-i18next'

// Opening section of the public page: what the program is.
export function ProgramIntro() {
  const { t } = useTranslation('main')
  const tags = [t('heroTagCOPm'), t('heroTagCelo'), t('heroTagOnchain')]

  return (
    <section className="text-center">
      <p className="text-aurora text-xs font-semibold uppercase tracking-[0.22em]">
        {t('heroEyebrow')}
      </p>
      <h1 className="mt-4 text-balance font-display text-4xl font-medium leading-[1.05] text-foreground sm:text-6xl">
        {t('heroTitleLead')}{' '}
        <em className="text-aurora pr-1 font-normal italic">
          {t('heroTitleAccent')}
        </em>
      </h1>
      <div className="mx-auto mt-5 max-w-2xl space-y-3 text-pretty text-base leading-relaxed text-muted-foreground">
        <p>{t('programDescription1')}</p>
        <p>{t('programDescription2')}</p>
      </div>
      <ul className="mt-6 flex flex-wrap justify-center gap-2">
        {tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full border border-[var(--line-strong)] px-3 py-1 text-xs text-muted-foreground"
          >
            {tag}
          </li>
        ))}
      </ul>
    </section>
  )
}
