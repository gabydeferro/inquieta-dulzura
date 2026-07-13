# Design: Visual Polish

## Technical Approach

Three isolated CSS/SVG/React changes. No new components, no behavior changes — only presentation concerns.

| Deliverable            | Strategy                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CSS color vars**     | Replace oklch values in `:root`/`.dark` with hex palette. `@theme inline` block passes through — shadcn components auto-pickup via var references. |
| **Navbar active pill** | Add `useLocation()`, compare `pathname` to each `link.to`, apply `bg-brand-violet text-white` via `cn()`.                                          |
| **Logo SVG**           | Rewrite `public/logo.svg` with clean geometric paths, violet palette, Geist Variable font.                                                         |

---

## Architecture Decisions

| Option                                   | Tradeoff                                                                      | Decision                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| CSS vars vs. Tailwind classes for colors | Vars = one change for all shadcn components; classes = per-component edits    | **CSS vars** — zero component changes                               |
| `useLocation` vs. NavLink's `isActive`   | Both work; `useLocation` matches existing ScrollToTop pattern in codebase     | **useLocation** — consistency                                       |
| Inline SVG vs. separate file             | Separate file = caching, shared by 4 components. Inline = per-request payload | **Update public/logo.svg** — cache-friendly, single source of truth |

---

## Data Flow

No runtime data flow changes. The color variables flow via CSS cascade:

```
:root vars ──→ @theme inline (Tailwind mappings) ──→ shadcn components (bg-background, text-foreground, etc.)
```

Navbar active pill is a purely client-side rendering concern — `useLocation` → `pathname` → conditional `className`.

---

## File Changes

| File                               | Action | Description                                                                                               |
| ---------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `client/src/styles.css`            | Modify | Replace oklch values in `:root` (L49–81) and `.dark` (L99–130) with spec hex values                       |
| `client/src/components/Navbar.tsx` | Modify | Add `useLocation` import, `cn` import, pathname comparison, conditional classes on desktop + mobile links |
| `client/public/logo.svg`           | Modify | Rewrite SVG geometry: petal paths instead of scattered circles, 3 violet tones, Geist Variable font       |

---

## Interfaces / Contracts

No new interfaces. The CSS var contract is stable — shadcn components already consume `--background`, `--foreground`, etc. The change only alters the values, not the names.

**CSS var mapping (unchanged contract):** `@theme inline` lines 132–173 map `--background` → `--color-background` etc. — that block stays untouched.

---

## Testing Strategy

| Layer               | What to Test                                 | Approach                                                        |
| ------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| Visual — light mode | Dashboard, Login, LandingPage in light theme | Open each page, verify bg/card/text/accent colors match spec    |
| Visual — dark mode  | Same pages in dark theme                     | Toggle theme, repeat verification                               |
| Visual — navbar     | Each nav link in desktop + mobile            | Click each link, verify active pill shows correct bg/text       |
| Visual — logo       | All 4 pages referencing logo.svg             | Confirm flower geometry renders, font is Geist, no broken paths |

No unit tests needed — pure CSS and markup changes. Verification is manual browser inspection for all 3 deliverables.

---

## Migration / Rollout

No migration required. One-shot change to CSS vars, one component edit, one SVG rewrite. All changes are backwards-compatible in rendering (old oklch → new hex, same CSS var names).

---

## Open Questions

- [ ] Review logo SVG flower geometry before final — the current 8-circle approach is being replaced with path-based petals. The exact SVG path coordinates need visual validation.
- [ ] Confirm `bg-brand-violet` (#7c5daf) is the correct active-pill color — it's already used elsewhere in the Navbar (line 59, line 72) so it's consistent by design.
