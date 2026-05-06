# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] — 2026-05-06

### Breaking

- **Minimum Node.js is now 20 LTS** (was Node 4).
- Library is shipped as a dual **ESM + CJS** package with TypeScript types via
  `dist/index.js`, `dist/index.cjs`, and `dist/index.d.ts`.
- The class is exposed as a **named export only**: use `import { Mconf } from
  'mconf'` or `const { Mconf } = require('mconf')`. The legacy
  `require('mconf').default` shape is gone.
- **Strict by default.** `getConfig()` now throws when the requested env is
  not a member of `availableEnvs`. Pass `strict: false` to restore the
  silent fallback-to-`develop` behaviour from 1.x.
- `baseEnv` and `fallbackEnv` must both be members of `availableEnvs`. Invalid
  combinations now throw at construction time instead of failing on first
  `getConfig()` call.
- `availableEnvs` must not contain duplicates.
- Configs **must** export a plain object. Primitives are rejected with a
  `TypeError` instead of being silently merged.
- Configs **must not** declare an `environment` key — the loader reserves it
  for the merged result and throws on collision.
- Error messages from the loader changed:
  - `Mconf: config "X" not found in Y` → `Mconf: config "X" not found at Y`.
  - The non-`MODULE_NOT_FOUND` branch now reads `Mconf: failed to load config
    "X" from Y: <reason>`. Both errors carry an `Error.cause`.
- `availableEnvs` and the `baseEnv`/`fallbackEnv` options are validated against
  `^[A-Za-z0-9][A-Za-z0-9_.-]*$`. Unsafe values throw `TypeError`.
- Repeated `getConfig()` calls no longer mutate the instance's hierarchy state
  and no longer share nested-object, array, or other references with
  previously-returned configs (or with Node's module cache). Cloneable values
  are passed through `structuredClone`; types that cannot be cloned (functions,
  `WeakMap`, etc.) are still shared by reference.
- Shallow merge (`deepMerge: false`) now also clones top-level values rather
  than aliasing the loaded module; the shallow path used to leak references
  into Node's module cache.
- All instance state (`configDir`, `availableEnvs`, `envName`, `deepMerge`,
  `baseEnv`, `fallbackEnv`, `strict`) is held in private fields. Mutation must
  go through `setEnvName()` or `setDeepMerge()`; direct property writes have no
  effect.
- The reserved-key collision now throws `TypeError` (was `Error`).

### Added

- Constructor-level `options`: `envName`, `deepMerge`, `baseEnv`, `fallbackEnv`,
  `strict`.
- TypeScript declarations generated from JSDoc.
- `__esModule`-aware unwrapping of transpiled-ESM config files; plain CJS
  configs with a legitimate `default` key are left untouched.
- `"sideEffects": false` in `package.json` for bundler tree-shaking.
- GitHub Actions CI matrix (Node 20/22/24 × Ubuntu, plus single-shot
  macOS/Windows runs on Node 22), tag-driven release workflow with
  `npm publish --provenance` via OIDC, and Dependabot.

### Removed

- Dropped runtime dependency on `extend`. Deep-merge is an inline implementation
  that refuses to write `__proto__` / `constructor` / `prototype` keys.
- Dropped Babel, `mockery`, `chai`, `mocha`, `istanbul`, and `webpack` dev
  dependencies. Tests run on the built-in `node:test` runner; coverage via `c8`.
- Removed the `getEnvironmentFromGlobalEnv()` PhantomJS fallback.
- Removed the redundant `setEnv()` alias added during the same release cycle.
- Removed the legacy `"module"` field in `package.json` (subsumed by `exports`).
- Deleted obsolete CI configs (`.travis.yml`, `circle.yml`, `.gitlab-ci.yml`).

### Fixed

- `getConfig()` no longer pushes to a shared `configHierarchy` array on every
  call.
- Errors from misbehaving config files now propagate the original error via
  `Error.cause` instead of being lost.
- Class is now named `Mconf` so stack traces are readable.

## [1.0.0] — 2016

Last release of the legacy 1.x line. See git history for details.
