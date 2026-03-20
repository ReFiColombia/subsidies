# Codebase Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize all naming conventions, file structure, imports, exports, and formatting across the subsidies app.

**Architecture:** Convention-first approach — install tooling, fix structural issues, then bulk-format. No functional changes.

**Tech Stack:** React 18, TypeScript, Vite, ESLint (flat config), Prettier

**Spec:** `docs/superpowers/specs/2026-03-19-codebase-standardization-design.md`

---

## File Map

### Files to Create
- `frontend/.prettierrc`
- `frontend/.prettierignore`

### Files to Delete
- `frontend/src/components/ui/_button.tsx`
- `frontend/src/utils.ts` (after merging into lib/utils.ts)

### Files to Rename
- `smart-cotracts/` → `smart-contracts/`
- `frontend/src/components/layout/navbar.tsx` → `Navbar.tsx`
- `frontend/src/hooks/use-toast.ts` → `useToast.ts`

### Files to Move
- `frontend/src/components/BeneficiaryName.tsx` → `frontend/src/components/pages/main/BeneficiaryName.tsx`

### Files to Modify
- `frontend/package.json` (add devDependencies)
- `frontend/eslint.config.js` (add import sort + type import rules)
- `frontend/vite.config.ts` (add @graphclient alias)
- `frontend/tsconfig.json` (add @graphclient path)
- `frontend/tsconfig.app.json` (add @graphclient path)
- `frontend/src/lib/utils.ts` (merge secondsToDays)
- `frontend/src/constants/index.ts` (add address comments)
- `frontend/.env` (add comment)
- `frontend/src/main.tsx` (update imports for renames + named exports)
- `frontend/src/App.tsx` (update imports + convert to named export)
- `frontend/src/pages/Admin.tsx` (update imports + convert to named export)
- `frontend/src/hooks/useSubsidyContract.ts` (convert to named export)
- `frontend/src/components/ui/toaster.tsx` (update use-toast import)
- `frontend/src/components/pages/main/UserFundsCard.tsx` (update import + named export)
- `frontend/src/components/pages/main/Header.tsx` (update import + named export)
- `frontend/src/components/pages/main/Description.tsx` (update import + named export)
- `frontend/src/components/pages/main/DonationProgress.tsx` (named export)
- `frontend/src/components/pages/main/DonationReceipt.tsx` (named export)
- `frontend/src/components/pages/main/DonationStats.tsx` (update graphclient import + named export)
- `frontend/src/components/pages/main/Info.tsx` (named export)
- `frontend/src/components/pages/main/ProgramStats.tsx` (named export)
- `frontend/src/components/pages/main/QuickAmountPicker.tsx` (named export)
- `frontend/src/components/pages/main/SwapWidget.tsx` (named export)
- `frontend/src/components/pages/admin/Dashboard.tsx` (named export)
- `frontend/src/components/pages/admin/FundsCard.tsx` (update import + named export)
- `frontend/src/components/pages/admin/BeneficiariesCard.tsx` (update import + named export)
- `frontend/src/components/pages/admin/BeneficiariesPanel.tsx` (update imports + named export)
- `frontend/src/components/pages/admin/DailyClaimsCard.tsx` (update graphclient import + named export)

---

## Task 1: Install Dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install prettier and plugins**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend && npm install -D prettier eslint-plugin-simple-import-sort prettier-plugin-tailwindcss
```

- [ ] **Step 2: Verify installation**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend && npx prettier --version
```

Expected: prints a version number (3.x.x)

- [ ] **Step 3: Commit**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend && git add package.json package-lock.json && git commit -m "chore: add prettier and eslint-plugin-simple-import-sort"
```

---

## Task 2: Add Prettier & ESLint Config

**Files:**
- Create: `frontend/.prettierrc`
- Create: `frontend/.prettierignore`
- Modify: `frontend/eslint.config.js`

- [ ] **Step 1: Create `.prettierrc`**

Write to `frontend/.prettierrc`:

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

- [ ] **Step 2: Create `.prettierignore`**

Write to `frontend/.prettierignore`:

```
node_modules
dist
.graphclient
```

- [ ] **Step 3: Update ESLint config**

Replace `frontend/eslint.config.js` with:

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
    },
  },
)
```

- [ ] **Step 4: Add format script to package.json**

Add to `frontend/package.json` scripts:

```json
"format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
"format:check": "prettier --check \"src/**/*.{ts,tsx,css}\""
```

- [ ] **Step 5: Commit**

```bash
git add frontend/.prettierrc frontend/.prettierignore frontend/eslint.config.js frontend/package.json && git commit -m "chore: configure prettier and eslint import sorting"
```

---

## Task 3: Delete Duplicate & Merge Utils

**Files:**
- Delete: `frontend/src/components/ui/_button.tsx`
- Delete: `frontend/src/utils.ts`
- Modify: `frontend/src/lib/utils.ts`
- Modify: `frontend/src/components/pages/main/Description.tsx` (line 2)
- Modify: `frontend/src/components/pages/main/Header.tsx` (line 1)

- [ ] **Step 1: Delete `_button.tsx`**

```bash
rm /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend/src/components/ui/_button.tsx
```

- [ ] **Step 2: Add `secondsToDays` to `lib/utils.ts`**

Edit `frontend/src/lib/utils.ts` — add after the `cn` function:

```typescript
export const secondsToDays = (seconds: number) =>
  Math.round(seconds / 60 / 60 / 24)
```

- [ ] **Step 3: Update imports in Description.tsx**

In `frontend/src/components/pages/main/Description.tsx` line 2, change:

```typescript
import { secondsToDays } from '@/utils';
```

to:

```typescript
import { secondsToDays } from '@/lib/utils';
```

- [ ] **Step 4: Update imports in Header.tsx**

In `frontend/src/components/pages/main/Header.tsx` line 1, change:

```typescript
import { secondsToDays } from '@/utils';
```

to:

```typescript
import { secondsToDays } from '@/lib/utils';
```

- [ ] **Step 5: Delete `src/utils.ts`**

```bash
rm /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend/src/utils.ts
```

- [ ] **Step 6: Commit**

```bash
git add -A frontend/src/components/ui/_button.tsx frontend/src/utils.ts frontend/src/lib/utils.ts frontend/src/components/pages/main/Description.tsx frontend/src/components/pages/main/Header.tsx && git commit -m "chore: remove duplicate button, merge utils into lib/utils"
```

---

## Task 4: Rename Directory & Files

**Files:**
- Rename: `smart-cotracts/` → `smart-contracts/`
- Rename: `frontend/src/components/layout/navbar.tsx` → `Navbar.tsx`
- Rename: `frontend/src/hooks/use-toast.ts` → `useToast.ts`
- Move: `frontend/src/components/BeneficiaryName.tsx` → `frontend/src/components/pages/main/BeneficiaryName.tsx`
- Modify: `frontend/src/main.tsx` (line 5 — navbar import)
- Modify: `frontend/src/App.tsx` (line 13 — use-toast import)
- Modify: `frontend/src/components/ui/toaster.tsx` (line 1)
- Modify: `frontend/src/components/pages/main/UserFundsCard.tsx` (line 16)
- Modify: `frontend/src/components/pages/admin/FundsCard.tsx` (line 17)
- Modify: `frontend/src/components/pages/admin/BeneficiariesCard.tsx` (line 10)
- Modify: `frontend/src/components/pages/admin/BeneficiariesPanel.tsx` (line 6)

- [ ] **Step 1: Rename smart-cotracts directory**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies && git mv smart-cotracts smart-contracts
```

- [ ] **Step 2: Rename navbar.tsx to Navbar.tsx**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies && git mv frontend/src/components/layout/navbar.tsx frontend/src/components/layout/Navbar.tsx
```

- [ ] **Step 3: Update navbar import in main.tsx**

In `frontend/src/main.tsx` line 5, change:

```typescript
import { NavBar } from '@/components/layout/navbar.tsx';
```

to:

```typescript
import { NavBar } from '@/components/layout/Navbar';
```

(Also drop the `.tsx` extension from the import)

- [ ] **Step 4: Rename use-toast.ts to useToast.ts**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies && git mv frontend/src/hooks/use-toast.ts frontend/src/hooks/useToast.ts
```

- [ ] **Step 5: Update all use-toast imports (6 files)**

In each file, change `use-toast` to `useToast` in the import path:

**`frontend/src/App.tsx`** line 13:
```typescript
import { useToast } from './hooks/useToast'
```

**`frontend/src/components/ui/toaster.tsx`** line 1:
```typescript
import { useToast } from "@/hooks/useToast"
```

**`frontend/src/components/pages/main/UserFundsCard.tsx`** line 16:
```typescript
import { useToast } from '@/hooks/useToast'
```

**`frontend/src/components/pages/admin/FundsCard.tsx`** line 17:
```typescript
import { useToast } from '@/hooks/useToast'
```

**`frontend/src/components/pages/admin/BeneficiariesCard.tsx`** line 10:
```typescript
import { useToast } from "@/hooks/useToast"
```

**`frontend/src/components/pages/admin/BeneficiariesPanel.tsx`** line 6:
```typescript
import { useToast } from '@/hooks/useToast'
```

- [ ] **Step 6: Move BeneficiaryName.tsx**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies && git mv frontend/src/components/BeneficiaryName.tsx frontend/src/components/pages/main/BeneficiaryName.tsx
```

(No import updates needed — this component is not imported anywhere currently)

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: rename smart-cotracts, standardize file names and locations"
```

---

## Task 5: Add @graphclient Path Alias

**Files:**
- Modify: `frontend/tsconfig.json`
- Modify: `frontend/tsconfig.app.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/components/pages/admin/DailyClaimsCard.tsx` (line 2)
- Modify: `frontend/src/components/pages/main/DonationStats.tsx` (line 2)
- Modify: `frontend/src/components/pages/admin/BeneficiariesPanel.tsx` (line 2)

- [ ] **Step 1: Add path to tsconfig.json**

In `frontend/tsconfig.json`, add to the `paths` object:

```json
"@graphclient": ["./.graphclient"]
```

So it becomes:

```json
"paths": {
  "@/*": ["./src/*"],
  "@graphclient": ["./.graphclient"]
}
```

- [ ] **Step 2: Add path to tsconfig.app.json**

In `frontend/tsconfig.app.json`, add to the `paths` object:

```json
"@graphclient": ["./.graphclient"]
```

- [ ] **Step 3: Add alias to vite.config.ts**

In `frontend/vite.config.ts`, add to the `resolve.alias` object:

```typescript
"@graphclient": path.resolve(__dirname, "./.graphclient"),
```

- [ ] **Step 4: Update 3 graphclient imports**

**`frontend/src/components/pages/admin/DailyClaimsCard.tsx`** line 2:
```typescript
import { getBuiltGraphSDK } from '@graphclient'
```

**`frontend/src/components/pages/main/DonationStats.tsx`** line 2:
```typescript
import { getBuiltGraphSDK } from '@graphclient'
```

**`frontend/src/components/pages/admin/BeneficiariesPanel.tsx`** line 2:
```typescript
import { getBuiltGraphSDK } from '@graphclient'
```

- [ ] **Step 5: Commit**

```bash
git add frontend/tsconfig.json frontend/tsconfig.app.json frontend/vite.config.ts frontend/src/components/pages/admin/DailyClaimsCard.tsx frontend/src/components/pages/main/DonationStats.tsx frontend/src/components/pages/admin/BeneficiariesPanel.tsx && git commit -m "chore: add @graphclient path alias, update imports"
```

---

## Task 6: Convert Default Exports to Named Exports

**Files:** 18 files with `export default` (see list below)

For each file, convert `export default X` to `export function X` or `export const X`, and update all corresponding import sites to use named imports `{ X }`.

- [ ] **Step 1: Convert App.tsx**

In `frontend/src/App.tsx`:
- Line 3: Change `function App()` to `export function App()`
- Line 197: Delete `export default App;`

In `frontend/src/main.tsx` line 6, change:
```typescript
import App from '@/App.tsx';
```
to:
```typescript
import { App } from '@/App';
```

- [ ] **Step 2: Convert Admin.tsx**

In `frontend/src/pages/Admin.tsx`:
- Line 5: Change `function AdminPanel()` to `export function AdminPanel()`
- Line 20: Delete `export default AdminPanel;`

In `frontend/src/main.tsx` line 7, change:
```typescript
import AdminPanel from '@/pages/Admin.tsx';
```
to:
```typescript
import { AdminPanel } from '@/pages/Admin';
```

- [ ] **Step 3: Convert useSubsidyContract.ts**

In `frontend/src/hooks/useSubsidyContract.ts`:
- Change `function useSubsidyContract` to `export function useSubsidyContract`
- Line 44: Delete `export default useSubsidyContract`

In `frontend/src/App.tsx` line 12, change:
```typescript
import useSubsidyContract from './hooks/useSubsidyContract';
```
to:
```typescript
import { useSubsidyContract } from './hooks/useSubsidyContract';
```

- [ ] **Step 4: Convert all page components (batch)**

For each of these files, change `export default X` to inline `export function X` or add `export` before the function/const declaration. Delete the `export default` line.

Files (no import updates needed — these are all imported with default imports that must be changed to named):

| File | Current export | Importing file | Import line |
|------|---------------|----------------|-------------|
| `Header.tsx` | `export default Header` (L74) | `App.tsx` | L5 |
| `Description.tsx` | `export default Description` (L55) | `App.tsx` | L7 |
| `Info.tsx` | `export default Info` (L27) | `App.tsx` | L8 |
| `UserFundsCard.tsx` | `export default UserFundsCard` (L313) | `App.tsx` | L17 |
| `ProgramStats.tsx` | `export default function ProgramStats` (L33) | `App.tsx` | L18 |
| `DonationProgress.tsx` | `export default function DonationProgress` (L22) | `UserFundsCard.tsx` | check import |
| `DonationReceipt.tsx` | `export default function DonationReceipt` (L13) | `UserFundsCard.tsx` | check import |
| `QuickAmountPicker.tsx` | `export default function QuickAmountPicker` (L15) | `UserFundsCard.tsx` | check import |
| `SwapWidget.tsx` | `export default function SwapWidget` (L193) | `UserFundsCard.tsx` | check import |
| `DonationStats.tsx` | `export default function DonationStats` (L8) | check importers |
| `Dashboard.tsx` | `export default Dashboard` (L22) | `Admin.tsx` | L3 |
| `FundsCard.tsx` | `export default FundsCard` (L211) | `Admin.tsx` | L2 |
| `BeneficiariesCard.tsx` | `export default BeneficiariesCard` (L336) | `Admin.tsx` | L1 |
| `BeneficiariesPanel.tsx` | `export default BeneficiariesPanel` (L890) | `BeneficiariesCard.tsx` | check |
| `DailyClaimsCard.tsx` | `export default DailyClaimsCard` (L148) | `Dashboard.tsx` | check |

For each: add `export` to function declaration, delete `export default` line, change importing file from `import X from` to `import { X } from`.

- [ ] **Step 5: Commit**

```bash
git add -A frontend/src && git commit -m "chore: convert all default exports to named exports"
```

---

## Task 7: Add Documentation Comments

**Files:**
- Modify: `frontend/.env`
- Modify: `frontend/src/constants/index.ts`

- [ ] **Step 1: Add comment to .env**

At the top of `frontend/.env`, add:

```
# Future contract address (deployed, not yet active)
```

Before the `VITE_CONTRACT_ADDRESS` line.

- [ ] **Step 2: Add comment to constants/index.ts**

In `frontend/src/constants/index.ts`, add comment before line 3:

```typescript
// Active contract address on Celo
export const SUBSIDY_CONTRACT_ADDRESS = "0x947C6dB1569edc9fd37B017B791cA0F008AB4946"
// Future contract: 0x1A6FBc7b51E55C6D4F15c8D5CE7e97daEA699ecf (deployed, not yet active)
```

- [ ] **Step 3: Commit**

```bash
git add frontend/.env frontend/src/constants/index.ts && git commit -m "docs: clarify contract addresses in env and constants"
```

---

## Task 8: Bulk Format with Prettier

**Files:** All `.ts`, `.tsx`, `.css` files in `frontend/src/`

- [ ] **Step 1: Run Prettier on entire frontend**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend && npx prettier --write "src/**/*.{ts,tsx,css}"
```

- [ ] **Step 2: Run ESLint auto-fix for import sorting**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend && npx eslint --fix "src/**/*.{ts,tsx}"
```

- [ ] **Step 3: Commit**

```bash
git add -A frontend/src && git commit -m "style: bulk format with prettier and sort imports"
```

---

## Task 9: Verify Build & Lint

- [ ] **Step 1: Run TypeScript build**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend && npm run build
```

Expected: completes with zero errors

- [ ] **Step 2: Run lint**

```bash
cd /Users/0xj4an/Documents/GitHub/0xj4an_personal/subsidies/frontend && npm run lint
```

Expected: completes with zero errors (warnings OK)

- [ ] **Step 3: Fix any errors**

If build or lint fails, fix the issues and re-run until both pass.

- [ ] **Step 4: Final commit if fixes were needed**

```bash
git add -A frontend/src && git commit -m "fix: resolve build/lint errors from standardization"
```
