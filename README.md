# Portfolio v2

Personal portfolio site, built for speed and with a bit of personality.

[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui&logoColor=white)](https://ui.shadcn.com)

## Features

- ⚡️ Vite + React + TypeScript
- 🎨 Tailwind CSS v4 + shadcn/ui (radix base)
- 🌐 i18n out of the box — Portuguese and English, auto-detected from the browser

## Getting started

Requires Node 20+.

```bash
# clone
git clone git@github.com:rosa-gabriel/portfolio-v2.git
cd portfolio-v2

# install
npm install

# run the dev server
npm run dev
```

## Scripts

| Command           | Description                        |
| ------------------ | ----------------------------------- |
| `npm run dev`     | Start the dev server with HMR       |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview the production build        |
| `npm run lint`    | Lint the codebase                   |

## Project structure

```
src/
├── components/   # UI components (includes shadcn/ui primitives in components/ui)
├── i18n/         # i18next setup and locale files (en, pt)
├── lib/          # Shared utilities
├── App.tsx       # App entry component
└── main.tsx      # App bootstrap
```

## Adding UI components

This project uses the [shadcn/ui](https://ui.shadcn.com) CLI rather than hand-rolled components:

```bash
npx shadcn@latest add <component>
```

## Contributing guidelines

Project-specific conventions (design direction, i18n, code style) live in [`CLAUDE.md`](./CLAUDE.md).
