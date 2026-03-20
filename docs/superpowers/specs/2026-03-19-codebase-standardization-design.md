# Codebase Standardization Design

## Problem

The subsidies app has grown organically and accumulated 14 inconsistencies across naming conventions, file structure, code style, imports, and tooling. This spec defines the target conventions and the changes needed to reach them.

## Scope

Full standardization across frontend and project root. Backend gets Prettier/ESLint applied but no structural changes. No functional changes.

## Dependencies to Install

### Frontend

```bash
npm install -D prettier eslint-plugin-simple-import-sort prettier-plugin-tailwindcss
```

- `prettier` ^3.x — code formatting
- `eslint-plugin-simple-import-sort` ^12.x — import ordering (works with flat config)
- `prettier-plugin-tailwindcss` ^0.6.x — Tailwind class sorting

## 1. File Naming Conventions

| File type | Convention | Example |
|-----------|-----------|---------|
| React components | PascalCase | `Header.tsx`, `Navbar.tsx` |
| Hooks | camelCase with `use` prefix | `useToast.ts`, `useBeneficiaries.ts` |
| Utilities/libs | camelCase | `utils.ts`, `client.ts` |
| Config files | camelCase | `providers.tsx`, `index.ts` |
| UI primitives (shadcn) | kebab-case | `button.tsx`, `date-picker.tsx` |
| Constants | camelCase file, SCREAMING_SNAKE values | `constants/index.ts` |

No barrel exports (`index.ts`) for `components/ui/` — keep direct imports.

### Renames

- `components/layout/navbar.tsx` → `components/layout/Navbar.tsx`
- `hooks/use-toast.ts` → `hooks/useToast.ts`
- Update all imports referencing renamed files

## 2. Project Structure Cleanup

| Issue | Action |
|-------|--------|
| `smart-cotracts/` directory typo | Rename to `smart-contracts/` |
| `BeneficiaryName.tsx` in components root | Move to `components/pages/main/BeneficiaryName.tsx` |
| Duplicate `_button.tsx` | Delete (identical to `button.tsx`, zero imports) |
| Two utils files (`src/utils.ts` + `src/lib/utils.ts`) | Merge into `src/lib/utils.ts`, update imports |
| Awkward `@/../.graphclient` import | Add `@graphclient` path alias |

## 3. Code Style & Tooling

### Prettier Config (`.prettierrc` at frontend root)

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "jsxSingleQuote": false,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### `.prettierignore` (at frontend root)

```
node_modules
dist
.graphclient
```

### ESLint Enhancements (flat config syntax)

Add to `eslint.config.js`:

```javascript
import simpleImportSort from 'eslint-plugin-simple-import-sort'

// In the config array:
{
  plugins: {
    'simple-import-sort': simpleImportSort,
  },
  rules: {
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports',
      fixStyle: 'separate-type-imports',
    }],
  },
}
```

### Export Pattern Standardization

| File type | Pattern |
|-----------|---------|
| UI primitives (shadcn) | Named exports (keep as-is) |
| Page components | Named exports |
| Hooks | Named exports |
| Config/utils | Named exports |

Convert remaining `export default` to named exports.

## 4. Import & Type Standardization

### Path Aliases (tsconfig + vite.config)

| Alias | Maps to |
|-------|---------|
| `@/*` | `./src/*` (keep) |
| `@graphclient` | `./.graphclient` (relative to frontend root) |

### Import Order (enforced by `eslint-plugin-simple-import-sort`)

1. `react` / `react-dom`
2. Third-party libraries
3. `@/` aliases
4. `@graphclient`
5. Relative imports

### Type Imports

All type-only imports use `import type { ... }` syntax. Enforced by `@typescript-eslint/consistent-type-imports`.

### Quotes

- Single quotes in TS/JS (via Prettier)
- Double quotes in JSX attributes (via Prettier)

## 5. Environment & Config

- `.env` keeps `VITE_CONTRACT_ADDRESS=0x1A6FBc7b...` for future use
- `constants/index.ts` uses `0x947C6dB1...` as the active contract (no change needed)
- Add comment in `.env`:
  ```
  # Future contract address (deployed, not yet active)
  VITE_CONTRACT_ADDRESS=0x1A6FBc7b51E55C6D4F15c8D5CE7e97daEA699ecf
  ```
- Add comment in `constants/index.ts` documenting both addresses

## 6. Implementation Order

1. Install dependencies: `prettier`, `eslint-plugin-simple-import-sort`, `prettier-plugin-tailwindcss`
2. Add Prettier config (`.prettierrc`, `.prettierignore`) + enhance ESLint config
3. Fix critical issues: delete `_button.tsx`, merge utils, rename `smart-cotracts/`
4. Rename files: `navbar.tsx` → `Navbar.tsx`, `use-toast.ts` → `useToast.ts`
5. Move `BeneficiaryName.tsx` into proper directory
6. Add `@graphclient` path alias in tsconfig + vite.config, update 3 imports
7. Convert `export default` to named exports
8. Enforce `import type` across codebase
9. Add `.env` and `constants/index.ts` comments
10. Run Prettier on entire codebase (single bulk-format commit)
11. Run `npm run build && npm run lint` to verify nothing is broken
12. Manual smoke test: verify the app renders and core flows work

## Verification

Since no automated tests exist, verify by:
- `npm run build` passes with zero errors
- `npm run lint` passes with zero errors
- App renders at localhost (visual spot-check)

## Non-Goals

- No functional changes
- No new features
- No dependency upgrades
- No backend restructuring (single-file API is fine for current scale)
- No test additions
