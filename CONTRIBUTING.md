# Contributing

Thanks for taking the time to improve `mconf`.

## Development setup

```bash
npm install
```

## Useful commands

| Command                 | Purpose                                                 |
| ----------------------- | ------------------------------------------------------- |
| `npm test`              | Run the test suite via `node:test`.                     |
| `npm run test:coverage` | Run tests under `c8` and enforce coverage thresholds.   |
| `npm run lint`          | ESLint flat config (with the `n` and Prettier configs). |
| `npm run lint:fix`      | Auto-fix what ESLint can.                               |
| `npm run format`        | Prettier write.                                         |
| `npm run format:check`  | Prettier check (used in CI).                            |
| `npm run build`         | Build CJS + ESM + types into `dist/` via `tsup`.        |
| `npm run verify`        | Lint + format-check + coverage + build (full local CI). |

## Running a single test file

```bash
node --test --test-reporter=spec test/loading.test.js
```

Filter by test name:

```bash
node --test --test-name-pattern='deep-merges layers' test/
```

## Test fixtures

Fixtures live under `test/fixtures/` and are loaded by the production code path
(no mocks). The directory ships a nested `package.json` with `"type":
"commonjs"` so its `.js` files are CommonJS regardless of repo settings.

`test/fixtures/broken/develop.js` is **intentionally broken** — it references
an undefined identifier so the loader's non-`MODULE_NOT_FOUND` error branch can
be exercised. Don't "fix" it.

## Architecture summary

- Single source file: `src/index.js` (ESM, JSDoc-typed).
- Config files are loaded synchronously via `createRequire`, so they must be
  CommonJS. In an ESM project, use `.cjs`.
- Layering is `[baseEnv, env]` (deduplicated when they match). Order is fixed,
  on purpose: shared defaults first, environment-specific values second.
- `Error.cause` is preserved for both missing-module and
  config-throws-during-evaluation cases.
- Prototype-pollution guards live in the deep-merge loop.

## Releasing

Releases are tag-driven. Pushing `vX.Y.Z` triggers `.github/workflows/release.yml`
which runs `npm run verify` and then `npm publish --provenance --access public`.
The workflow uses an OIDC-issued provenance signature; no long-lived NPM token
is required beyond the secret bound to the `npm-publish` environment.
