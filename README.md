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

Requires **Node.js 18 or newer**.

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

If the requested env is not in your whitelist, `mconf` falls back to `develop`.
The merged result includes an `environment` field naming the layer that was
applied last.

```js
new Mconf(dir, ['production', 'develop'], {
  baseEnv: 'production', // first layer applied
  fallbackEnv: 'develop', // used when the env is missing or unknown
  strict: false, // set true to throw instead of falling back
  envName: 'NODE_ENV', // env var read for the current environment
  deepMerge: true, // false → top-level overwrite only
});
```

## API

### `new Mconf(configDir, availableEnvs, options?)`

| Argument        | Type           | Notes                                                     |
| --------------- | -------------- | --------------------------------------------------------- |
| `configDir`     | `string`       | Absolute path to the directory holding the config files.  |
| `availableEnvs` | `string[]`     | Whitelist of permitted env names (alnum + `_`, `-`, `.`). |
| `options`       | `MconfOptions` | See above.                                                |

### Instance methods

- `getConfig()` — load and merge the layers, return the merged object.
- `setEnvName(name)` / `setEnv(name)` — change the env var read at `getConfig()` time.
- `setDeepMerge(boolean)` — toggle deep merge.
- `getEnvironmentFromGlobalEnv()` — read the raw value from `process.env`.

All setters return `this` for chaining.

## Migration from 1.x

`2.0.0` is a major bump. Highlights:

- Minimum Node.js raised to **18 LTS**.
- Built and shipped as **dual ESM + CJS** with TypeScript types.
- Removed Babel toolchain and the `extend` dependency. Deep-merge is implemented
  inline and **rejects prototype-pollution keys** (`__proto__`, `constructor`,
  `prototype`).
- Env names are validated; path traversal is no longer possible via
  `availableEnvs` or via crafted `process.env` values.
- Errors thrown by the loader now carry an `Error.cause`, and the wording for
  load failures has changed. If your code matches on the old strings, update.
- Configs **must** export a plain object. Previous behaviour silently let
  primitives leak through.
- Configs are loaded synchronously via `createRequire`. In an ESM project, name
  config files `.cjs` (or set `"type": "commonjs"` in a nested `package.json`).
- Repeated `getConfig()` calls no longer accumulate state internally.

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
