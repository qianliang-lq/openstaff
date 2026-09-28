# Monorepo Conventions

## Structure

```
openstaff/
├── apps/
│   ├── desktop/          # Tauri desktop app (React)
│   └── web-admin/        # Admin web app (React)
├── packages/             # Shared TypeScript packages
├── crates/              # Rust workspace
└── docs/                # Documentation
```

## Naming

- Apps: `openstaff-{name}`
- Packages: `@openstaff/{name}`
- Crates: `openstaff-{name}`

## Tech Stack

- Package manager: pnpm
- Language: TypeScript, Rust
- UI: React 18+
- Desktop: Tauri 2.x
- Styling: CSS modules with FIND design tokens
- Testing: Vitest
- E2E: Playwright (desktop only)

## Code Style

- Use Prettier for formatting
- ESLint for linting
- TypeScript strict mode
- Modular, commented, readable code
- Follow React best practices
