# Frontend i18n: English/Spanish User Interface

**Date:** 2026-03-19
**Scope:** User-facing frontend only (not admin panel)

## Summary

Add English/Spanish language support to the user-facing frontend using `react-i18next`. The admin panel (`/admin`) remains hardcoded in Spanish. Language is auto-detected from the browser, with a manual toggle in the Navbar, persisted to localStorage.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| i18n library | react-i18next | Industry standard, hook-based API fits existing patterns, built-in browser detection & localStorage |
| Language switch UX | Browser auto-detect + Navbar toggle | Automatic for most users, manual override always available |
| Fallback language | English | User's explicit choice. Detection order (localStorage → navigator) means Spanish browser users still get Spanish automatically. English is the fallback for unrecognized locales. |
| Persistence | localStorage | Survives sessions without backend changes |
| Scope | User-facing pages only | Admin panel stays Spanish, reduces work and keeps admin simple |

## Architecture

### Dependencies

- `i18next` — core i18n engine
- `react-i18next` — React bindings (`useTranslation` hook, `I18nextProvider`)
- `i18next-browser-languagedetector` — auto-detects browser language

### File Structure

```
frontend/src/
  i18n/
    index.ts              # i18next initialization & config
    locales/
      en/
        common.json       # shared: navbar, buttons, errors, toasts
        main.json         # user-facing page strings (/ route)
      es/
        common.json
        main.json
```

### Namespaces

- **`common`** — Navbar labels, shared buttons, toast messages, wallet-related text
- **`main`** — All strings on the `/` route: Header, Description, Info, UserFundsCard, ProgramStats, and their child components

### i18next Configuration

```ts
// frontend/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enMain from './locales/en/main.json';
import esCommon from './locales/es/common.json';
import esMain from './locales/es/main.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, main: enMain },
      es: { common: esCommon, main: esMain },
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
    ns: ['common', 'main'],
    defaultNs: 'common',
  });

export default i18n;
```

### HTML lang attribute

On language change, update `document.documentElement.lang` to match the active language (`en` or `es`). This can be done via an `i18n.on('languageChanged')` listener in the i18n init file.

## Language Toggle Component

**Placement:** Navbar, right side, next to the `<appkit-button />` wallet component. The Navbar is a flex container with `justify-between` — the toggle goes in the right section alongside the wallet button.

**Design:** Simple `EN | ES` text toggle. Active language is visually highlighted (bold or brand color). Matches existing dark theme styling.

**Behavior:**
- Clicking calls `i18next.changeLanguage('en' | 'es')`
- i18next auto-persists to localStorage
- All user-facing text re-renders reactively
- Admin pages unaffected

## Translation Key Convention

Flat keys, grouped by component context. Descriptive and concise.

**Dynamic values** use i18next interpolation:
```json
"balanceAmount": "Your balance: {{amount}} COPm"
```

**Spanish files** contain the existing hardcoded strings — zero visible change for current users.

**Note:** The full set of translation keys will be extracted during implementation by reading every component listed below. The JSON files will contain all strings — approximately 40+ keys across both namespaces.

## Component Usage Pattern

```tsx
// Before
<h1>Reclamar</h1>

// After
const { t } = useTranslation('main');
<h1>{t('claimButton')}</h1>
```

For module-level constants outside component scope (e.g., chart config objects), use `i18next.t()` directly or move the config inside the component.

## Components To Modify

### User-facing (translate)

**Layout:**

- `src/components/layout/Navbar.tsx` — "User Panel" / "Admin Panel" labels, add language toggle component

**Main page (`App.tsx`):**

- `src/App.tsx` — "Reclamar" button text, donation disclaimer, all claim-related toast messages (error, pending, success)

**Main page child components:**

- `src/components/pages/main/Header.tsx` — heading text (multiple conditional branches)
- `src/components/pages/main/Description.tsx` — claim instructions
- `src/components/pages/main/Info.tsx` — claim history labels, date formatting locale (`toLocaleDateString`)
- `src/components/pages/main/UserFundsCard.tsx` — donation form labels, balance text, donation-related toast messages
- `src/components/pages/main/ProgramStats.tsx` — transparency section labels, chart config label ("COPm Distribuidos")
- `src/components/pages/main/DonationStats.tsx` — "Total donado", "Beneficiarios" labels
- `src/components/pages/main/DonationProgress.tsx` — step labels: "Aprobar", "Donar", "Listo"
- `src/components/pages/main/DonationReceipt.tsx` — success message, share text (Twitter), action buttons
- `src/components/pages/main/SwapWidget.tsx` — error boundary fallback text
- `src/components/pages/main/BeneficiaryName.tsx` — "Loading..." text

### Untouched

- `src/components/pages/admin/*` — all admin components stay hardcoded Spanish
- `src/pages/Admin.tsx` — no changes

## Number/Date/Currency Formatting

Existing formatting calls switch locale based on current i18next language:

- `Intl.NumberFormat` — `en-US` vs `es-CO`
- `Date.toLocaleDateString` (in `Info.tsx`) — `en-US` vs `es-CO`

## Social Sharing

`DonationReceipt.tsx` constructs a Twitter share URL with dynamic text. The share text string gets translated via i18next interpolation:

```json
"shareText": "I just donated {{amount}} cCOP to the ReFi Colombia subsidies program!"
```

## Error Handling

- **Missing translations:** fallback to English (`fallbackLng: 'en'`)
- **Blockchain errors:** Raw revert reasons stay as-is (technical, from external sources). Only user-friendly wrapper messages are translated.
- **First visit:** localStorage empty → browser detection → fallback to English

## Out of Scope

- Admin panel translation
- Server-side rendering / SEO meta tags (SPA only)
- Automated i18n testing
- Additional languages beyond EN/ES
