# Project Guidelines — Portfolio v2

This is Gabriel's personal portfolio site. Keep these standards in mind for every feature, component, and design decision.

## Design direction

- **Modern, with personality.** Avoid generic/templated "bootstrap portfolio" looks. Favor distinctive typography, motion, and layout choices over safe defaults.
- **Engaging visuals.** Lean into animation, micro-interactions, and visual flair (hover states, scroll-triggered reveals, subtle parallax, etc.) rather than static, flat sections. Motion should feel purposeful, not gratuitous.
- **Performance first.** "Really fast" is a hard requirement, not a nice-to-have — it trades off against visual flair when the two conflict:
  - Prefer CSS transforms/opacity for animation over JS-driven layout changes.
  - Lazy-load below-the-fold images/sections and heavy components.
  - Keep bundle size lean; avoid pulling in large animation/UI libraries for small effects.
  - Use `next/image`-equivalent best practices for this stack (responsive images, modern formats like AVIF/WebP, explicit dimensions to avoid layout shift).
  - Audit with Lighthouse/PageSpeed mentally when adding anything heavy (fonts, video, large JS deps).

## Internationalization

- The site must support **Portuguese and English**, with an easy way for users to switch between them.
- Don't hardcode user-facing strings in components — structure content so it can be localized (e.g. a simple i18n dictionary/library) from the start, rather than retrofitting it later.
- Default locale should be sensible (e.g. detect browser language or default to Portuguese since the author is Brazilian), but always give the user a visible way to switch.

## Code style

- Avoid in-code comments as much as possible. Code should be self-explanatory through naming and structure. Only add a comment when it captures a non-obvious "why" (a hidden constraint, a workaround, a surprising edge case) — never to restate what the code already says.

## Stack conventions (already set up)

- Vite + React + TypeScript, Tailwind CSS v4, shadcn/ui (radix base, nova preset).
- Path alias `@/*` → `src/*`.
- Use `npx shadcn@latest add <component>` to pull in new UI primitives rather than hand-rolling them.
