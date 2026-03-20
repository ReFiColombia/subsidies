# ReFi Medellin Subsidies - Brand Kit

## Brand Identity

**Project:** ReFi Colombia Subsidies Program
**Purpose:** On-chain subsidy distribution for beneficiaries on the Celo blockchain
**Personality:** Trustworthy, modern, transparent, community-focused

---

## Color Palette

### Primary Brand Colors (Purple)

The brand uses a purple palette that conveys trust, innovation, and community.

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `brand-50` | 270 100% 98% | #faf5ff | Subtle highlights, hover states on light elements |
| `brand-100` | 270 100% 95% | #f3e8ff | Light backgrounds, badges |
| `brand-200` | 269 100% 92% | #e9d5ff | Secondary text on dark backgrounds |
| `brand-300` | 269 97% 85% | #d8b4fe | Hover text, chart accent 2 |
| `brand-400` | 270 95% 75% | #c084fc | Links, icons, interactive text |
| `brand-500` | 271 91% 65% | #a855f7 | Chart accent, medium emphasis |
| `brand-600` | 271 81% 56% | #9333ea | Primary buttons, active states, chart primary |
| `brand-700` | 272 72% 47% | #7e22ce | Button hover, strong emphasis |
| `brand-800` | 273 67% 39% | #6b21a8 | Dark accents, borders |
| `brand-900` | 274 66% 32% | #581c87 | Deepest purple, tab backgrounds |

### Semantic Colors

| Token | Usage | Value |
|-------|-------|-------|
| `background` | Page background | Deep purple hsl(270, 30%, 10%) |
| `card` | Card backgrounds | Dark purple hsl(270, 25%, 12%) |
| `muted` | Muted backgrounds, inactive states | hsl(270, 20%, 20%) |
| `primary` | Primary actions (buttons, active tabs) | brand-600 |
| `destructive` | Error states, destructive actions | Red hsl(0, 70%, 50%) |
| `success` | Success states | Green hsl(142, 71%, 45%) |
| `warning` | Warning states | Orange hsl(38, 92%, 50%) |

### Chart Colors

| Token | Color | Usage |
|-------|-------|-------|
| `chart-1` | brand-600 (purple) | Primary data series |
| `chart-2` | brand-300 (light purple) | Secondary data series |
| `chart-3` | brand-900 (dark purple) | Tertiary data |
| `chart-4` | Violet (250, 50%, 45%) | Fourth series |
| `chart-5` | brand-400 (medium purple) | Fifth series |

---

## Typography

### Font Stack

```
Inter, system-ui, Avenir, Helvetica, Arial, sans-serif
```

**Inter** is the primary typeface. System fonts are used as fallbacks.

### Font Weights

| Weight | Usage |
|--------|-------|
| 400 (Regular) | Body text, descriptions |
| 500 (Medium) | Labels, links, buttons |
| 600 (Semibold) | Section headings, card titles |
| 700 (Bold) | Stats, emphasis values |

### Font Sizes (Tailwind Classes)

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 0.75rem | Captions, helper text |
| `text-sm` | 0.875rem | Secondary text, labels |
| `text-base` | 1rem | Body text |
| `text-lg` | 1.125rem | Card titles |
| `text-xl` | 1.25rem | Section headings |
| `text-2xl` | 1.5rem | Page headings |

---

## Spacing

Uses Tailwind's 4px base scale. Key patterns:

| Context | Value | Class |
|---------|-------|-------|
| Card padding | 24px | `p-6` |
| Grid gap | 16px | `gap-4` |
| Small gap | 12px | `gap-3` |
| Section spacing | 16px | `space-y-4` |
| Input margin | 4px | `mt-1` |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-xl` | 12px | Cards, containers |
| `rounded-lg` | 8px (var(--radius)) | Buttons, tabs, inputs |
| `rounded-md` | 6px | Small elements |
| `rounded-sm` | 4px | Badges, chips |

---

## Shadows

| Class | Usage |
|-------|-------|
| `shadow-sm` | Stat cards, subtle elevation |
| `shadow-md` | Main cards, dialogs |
| `shadow-lg` | Toasts, floating elements |

---

## Component Patterns

### Cards

All cards use the dark theme:
```
bg-card border-border rounded-xl shadow-md
```
- White text (`text-card-foreground`)
- Semi-transparent borders
- No white backgrounds anywhere

### Buttons

Primary buttons:
```
bg-primary text-primary-foreground hover:bg-brand-700 rounded-lg
```

### Tabs

Active tab:
```
data-[state=active]:bg-primary data-[state=active]:text-white
```

Inactive tab:
```
data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground
```

Tab container:
```
bg-muted rounded-xl p-1
```

### Inputs

```
border-border bg-transparent text-foreground placeholder:text-muted-foreground
```

### Links

```
text-brand-400 hover:text-brand-300
```

### Stat Cards (Small)

```
border border-white/10 bg-white/5 rounded-lg p-3
```

---

## Icons

Uses **Lucide React** icon library exclusively. No custom icon assets.

Common icons:
- `Loader2` — Loading states (with `animate-spin`)
- `TrendingUp`, `ArrowDownCircle`, `Users`, `Wallet` — Stats
- `Heart` — Donations
- `Search`, `Edit`, `Save`, `Check`, `X` — Actions

---

## Do's and Don'ts

### Do
- Use CSS variable tokens (`bg-card`, `text-primary`, `border-border`)
- Use the brand purple palette for all accent colors
- Keep everything dark theme
- Use `text-muted-foreground` for secondary text
- Use `bg-muted` for inactive/subtle backgrounds

### Don't
- Use hardcoded hex colors (use tokens instead)
- Use `bg-white` or light backgrounds
- Use cyan, blue, or other accent colors (purple only)
- Use different font families
- Mix light and dark theme patterns
