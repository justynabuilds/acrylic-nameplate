# Contributing

Thanks for helping with Acrylic Nameplate. This page covers everything you need to make a change and check it.

## Setup

You need Node 22.18 or newer (the exact version is in `.nvmrc`; run `nvm use` if you use nvm) and npm.

```
npm install
npm run dev        # demo at http://localhost:4176
```

## Where a change goes

The code has three layers. Most changes start at the bottom and move up.

1. **Core** (`src/core/engine.ts`): colour parsing, name fitting and the light's easing. No DOM, so it is easy to test. Add or update a test in `test/engine.test.ts` for any change here. The look lives in `src/core/styles.ts`.
2. **Web component** (`src/element/acrylic-nameplate-element.ts`): reads attributes, renders into a shadow root, fires events.
3. **React adapter** (`src/react/AcrylicNameplate.tsx`): a thin wrapper. When you add an attribute to the element, add the matching prop here.

When you add or change an attribute, also update the attribute table in `README.md`, and check that the playground (`demo/playground.ts`) has a control for every attribute. If the change is visual, make the same change in `framer/AcrylicNameplate.tsx` so both versions keep matching.

## Checks before you push

```
npm run typecheck
npm test
npm run build
```

Then run `npm run dev`, open `/demo/selftest.html` and check that every line passes. The self-test drives the real component in the browser (clicks, attributes, the light easing, fitting a long name) and catches what unit tests can't. Copying to the clipboard only works from a real click, so click the email key yourself to check it.

The same typecheck, tests and build run automatically on GitHub for every push and pull request.

## Commits and pull requests

- Keep commits small, with a short one-line message, for example `fix glow on narrow plates`.
- One topic per pull request. Say what changed and how you checked it.
- Add a line to `CHANGELOG.md` under "Unreleased" for anything a user would notice.

## Code style

- TypeScript, two-space indent (see `.editorconfig`), no semicolons.
- Comments explain why, not what.
- Keep the core free of DOM code so it stays testable.
