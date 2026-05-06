# mconf

[![CI](https://github.com/gumeniukcom/mconf/actions/workflows/ci.yml/badge.svg)](https://github.com/gumeniukcom/mconf/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/mconf.svg)](https://www.npmjs.com/package/mconf)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

Tiny environment-aware config loader for Node.js. Pick an environment name from
`process.env`, layer the matching config file on top of a shared base, and get
back a single merged object. Zero runtime dependencies.

## Install

```bash
npm install mconf
```

Requires **Node.js 20 or newer**.

## Usage

Create a directory of CommonJS config files (one per environment):

```
config/
├── production.js
├── rc.js
└── develop.js
```

Each file exports a plain object:

```js
// config/production.js
module.exports = {
  service: 'api',
  port: 80,
  feature: { flags: { darkMode: true } },
};
```

### ESM

```js
import { Mconf } from 'mconf';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

const config = new Mconf(join(here, 'config'), ['production', 'rc', 'develop']).getConfig();

export default config;
```

### CommonJS

```js
const { Mconf } = require('mconf');
const path = require('node:path');

const config = new Mconf(path.join(__dirname, 'config'), ['production', 'develop']).getConfig();

module.exports = config;
```

Run with the env you want:

```bash
NODE_ENV=production node app.js
```

## How layering works

`mconf` always merges in this order:

1. The **base** layer (`production` by default).
2. The layer matching the environment selected from `process.env`.

By default `mconf` is strict: if the requested env is not in `availableEnvs`,
`getConfig()` throws. Set `strict: false` to opt into the legacy silent
fallback to `fallbackEnv` (default `develop`).

The merged result is augmented with a reserved `environment` field naming the
layer that was applied last. Config files **must not** declare their own
`environment` key — the loader rejects collisions with a `TypeError`.

```js
new Mconf(dir, ['production', 'develop'], {
  baseEnv: 'production', // first layer applied; must be in availableEnvs
  fallbackEnv: 'develop', // used only when strict is false; must be in availableEnvs
  strict: true, // default; set false to silently fall back instead of throwing
  envName: 'NODE_ENV', // env var read for the current environment
  deepMerge: true, // false → top-level overwrite only
});
```

## API

### `new Mconf(configDir, availableEnvs, options?)`

| Argument        | Type           | Notes                                                                                                                                             |
| --------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `configDir`     | `string`       | Absolute path to the directory holding the config files.                                                                                          |
| `availableEnvs` | `string[]`     | Whitelist of permitted env names. Each entry must match `^[A-Za-z0-9][A-Za-z0-9_.-]*$` (alphanumeric first character, then alnum, `_`, `-`, `.`). |
| `options`       | `MconfOptions` | See above. `baseEnv` and `fallbackEnv` must both be members of `availableEnvs`.                                                                   |

### Instance methods

- `getConfig()` — load and merge the layers, return the merged object.
- `setEnvName(name)` — change the env var read at `getConfig()` time. Returns `this`.
- `setDeepMerge(boolean)` — toggle deep merge. Returns `this`.
- `getEnvironmentFromGlobalEnv()` — read the raw value from `process.env`.

## Config file format

Config files are loaded **synchronously** via `createRequire`, so they must be
CommonJS. In an ESM project (`"type": "module"` in `package.json`), name them
`.cjs` or place them under a directory with a nested
`{ "type": "commonjs" }` `package.json`. Top-level-`await` ESM and dynamic
`import()` are intentional non-goals: a config loader that returns a Promise
would force every caller to be async.

If your build pipeline outputs Babel/TypeScript-style transpiled modules
(`exports.__esModule = true; exports.default = …`), `mconf` unwraps them
automatically. Plain CJS configs that legitimately export a `default` key are
left untouched.

## Migration from 1.x

`2.0.0` is a major bump. Highlights:

- Minimum Node.js raised to **20 LTS**.
- Built and shipped as **dual ESM + CJS** with TypeScript types.
- The class is exposed as a **named export only**: `import { Mconf } from 'mconf'`
  / `const { Mconf } = require('mconf')`. The legacy `require('mconf').default`
  shape is gone.
- **Strict by default.** `getConfig()` now throws when the requested env is not
  in `availableEnvs`. Pass `strict: false` to restore the silent
  fallback-to-`develop` behaviour from 1.x.
- `baseEnv` and `fallbackEnv` are validated against `availableEnvs` at
  construction time; previously-silent misconfigurations now throw immediately.
- The `setEnv()` alias was removed; use `setEnvName()`.
- Removed Babel toolchain and the `extend` dependency. Deep-merge is implemented
  inline, **rejects prototype-pollution keys** (`__proto__`, `constructor`,
  `prototype`), and never mutates inputs (no shared references between calls).
- Env names are validated; path traversal is no longer possible via
  `availableEnvs` or crafted `process.env` values.
- Errors thrown by the loader now carry an `Error.cause`, and the wording for
  load failures has changed. If your code matched on the old strings, update.
- Configs **must** export a plain object. Primitives now throw instead of
  silently leaking through.
- Configs **must not** declare an `environment` key — that name is reserved
  for the merged result.
- Configs are loaded synchronously via `createRequire` (CommonJS only).
- Repeated `getConfig()` calls no longer accumulate state internally and no
  longer share nested-object references with previously-returned configs.

## Development

```bash
npm install
npm run lint
npm test
npm run test:coverage
npm run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

ISC © Stanislav Gumeniuk
