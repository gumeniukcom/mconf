# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] — Unreleased

### Breaking

- **Minimum Node.js is now 18 LTS** (was Node 4).
- Library is shipped as a dual **ESM + CJS** package with TypeScript types via
  `dist/index.js`, `dist/index.cjs`, and `dist/index.d.ts`.
- The class is exposed as a **named export**: use `import { Mconf } from 'mconf'`
  or `const { Mconf } = require('mconf')`. The legacy `require('mconf').default`
  shape is gone.
- Configs **must** export a plain object. Primitives are now rejected with a
  `TypeError` instead of being silently merged.
- Error messages from the loader changed:
  - `Mconf: config "X" not found in Y` → `Mconf: config "X" not found at Y`.
  - The non-`MODULE_NOT_FOUND` branch now reads `Mconf: failed to load config
    "X" from Y: <reason>`. Both errors carry an `Error.cause`.
- `availableEnvs` and the `baseEnv`/`fallbackEnv` options are validated against
  `^[A-Za-z0-9][A-Za-z0-9_.-]*$`. Unsafe values throw `TypeError`.
- Repeated `getConfig()` calls no longer mutate the instance's hierarchy state.

### Added

- `setEnv(name)` alias of `setEnvName(name)` (matches pre-1.0 documentation).
- Constructor-level `options`: `envName`, `deepMerge`, `baseEnv`, `fallbackEnv`,
  `strict`.
- `strict: true` causes `getConfig()` to throw when the requested env is not in
  `availableEnvs`, instead of silently falling back.
- TypeScript declarations generated from JSDoc.

### Removed

- Dropped runtime dependency on `extend`. Deep-merge is now an inline
  implementation that **refuses to write `__proto__`/`constructor`/`prototype`**
  keys, eliminating the prototype-pollution vector.
- Dropped Babel, `mockery`, `chai`, `mocha`, `istanbul`, and `webpack` dev
  dependencies. Tests run on the built-in `node:test` runner; coverage is
  collected with `c8`.
- Removed the `getEnvironmentFromGlobalEnv()` PhantomJS fallback.
- Deleted obsolete CI configs (`.travis.yml`, `circle.yml`, `.gitlab-ci.yml`)
  and replaced them with GitHub Actions.

### Fixed

- `getConfig()` no longer pushes to a shared `configHierarchy` array on every
  call.
- Errors from misbehaving config files now propagate the original error via
  `Error.cause` instead of being lost.
- Class is now named `Mconf` so stack traces are readable.

## [1.0.0] — 2016

Last release of the legacy 1.x line. See git history for details.
