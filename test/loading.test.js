import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Mconf } from '../src/index.js';
import { BROKEN_DIR, CONFIGS_DIR, NON_OBJECT_DIR, withCleanEnv } from './helpers/env.js';

function makeConfigDir(files) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'mconf-load-'));
  writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ type: 'commonjs', private: true }),
  );
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(path.join(dir, name), body);
  }
  return dir;
}

describe('Mconf config loading', () => {
  it('returns an object with the expected env marker', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const cfg = new Mconf(CONFIGS_DIR, ['production', 'develop']).getConfig();
      assert.equal(typeof cfg, 'object');
      assert.equal(cfg.environment, 'develop');
    });
  });

  it('falls back to develop when env is unknown (strict: false)', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'no-such-env';
      const cfg = new Mconf(CONFIGS_DIR, ['production', 'develop'], {
        strict: false,
      }).getConfig();
      assert.equal(cfg.environment, 'develop');
    });
  });

  it('falls back to develop when env var is unset (strict: false)', async () => {
    await withCleanEnv(() => {
      delete process.env.NODE_ENV;
      const cfg = new Mconf(CONFIGS_DIR, ['production', 'develop'], {
        strict: false,
      }).getConfig();
      assert.equal(cfg.environment, 'develop');
    });
  });

  it('uses only the base env when requested env equals it', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'production';
      const cfg = new Mconf(CONFIGS_DIR, ['production', 'develop']).getConfig();
      assert.equal(cfg.environment, 'production');
      assert.equal(cfg.debug, undefined);
    });
  });

  it('reports a missing config file with the resolved path', async () => {
    const dir = makeConfigDir({ 'production.js': 'module.exports = { ok: true };\n' });
    try {
      await withCleanEnv(() => {
        process.env.NODE_ENV = 'develop';
        const m = new Mconf(dir, ['production', 'develop']);
        assert.throws(
          () => m.getConfig(),
          (err) => {
            assert.match(err.message, /Mconf: config "develop" not found at/);
            assert.equal(err.cause?.code, 'MODULE_NOT_FOUND');
            return true;
          },
        );
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reports a broken config with the original cause attached', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const m = new Mconf(BROKEN_DIR, ['production', 'develop']);
      assert.throws(
        () => m.getConfig(),
        (err) => {
          assert.match(err.message, /failed to load config "develop" from/);
          assert.ok(err.cause instanceof ReferenceError);
          return true;
        },
      );
    });
  });

  it('rejects configs that do not export a plain object', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const m = new Mconf(NON_OBJECT_DIR, ['production', 'develop']);
      assert.throws(
        () => m.getConfig(),
        /config "production" must export a plain object, got string/,
      );
    });
  });

  it('describes a null export precisely in the rejection message', async () => {
    const dir = makeConfigDir({
      'production.js': 'module.exports = null;\n',
      'develop.js': 'module.exports = { ok: true };\n',
    });
    try {
      await withCleanEnv(() => {
        process.env.NODE_ENV = 'develop';
        const m = new Mconf(dir, ['production', 'develop']);
        assert.throws(() => m.getConfig(), /must export a plain object, got null/);
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('describes an array export precisely in the rejection message', async () => {
    const dir = makeConfigDir({
      'production.js': 'module.exports = [1, 2, 3];\n',
      'develop.js': 'module.exports = { ok: true };\n',
    });
    try {
      await withCleanEnv(() => {
        process.env.NODE_ENV = 'develop';
        const m = new Mconf(dir, ['production', 'develop']);
        assert.throws(() => m.getConfig(), /must export a plain object, got array/);
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects configs that declare the reserved "environment" key', async () => {
    const dir = makeConfigDir({
      'production.js': 'module.exports = { service: "api" };\n',
      'develop.js': 'module.exports = { environment: "eu-west-1" };\n',
    });
    try {
      await withCleanEnv(() => {
        process.env.NODE_ENV = 'develop';
        const m = new Mconf(dir, ['production', 'develop']);
        assert.throws(
          () => m.getConfig(),
          /config "develop" must not declare reserved key "environment"/,
        );
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('unwraps transpiled-ESM exports via the __esModule marker', async () => {
    const dir = makeConfigDir({
      'production.js':
        'Object.defineProperty(exports, "__esModule", { value: true });\n' +
        'exports.default = { service: "api", port: 80 };\n',
      'develop.js': 'module.exports = { port: 3000 };\n',
    });
    try {
      await withCleanEnv(() => {
        process.env.NODE_ENV = 'develop';
        const cfg = new Mconf(dir, ['production', 'develop']).getConfig();
        assert.equal(cfg.service, 'api');
        assert.equal(cfg.port, 3000);
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('keeps a legitimate "default" key on plain CJS configs', async () => {
    const dir = makeConfigDir({
      'production.js': 'module.exports = { default: "literal-string-key", other: 1 };\n',
      'develop.js': 'module.exports = { other: 2 };\n',
    });
    try {
      await withCleanEnv(() => {
        process.env.NODE_ENV = 'develop';
        const cfg = new Mconf(dir, ['production', 'develop']).getConfig();
        assert.equal(cfg.default, 'literal-string-key');
        assert.equal(cfg.other, 2);
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('does not accumulate hierarchy across repeated getConfig() calls', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
      const a = m.getConfig();
      const b = m.getConfig();
      assert.deepEqual(a, b);
    });
  });

  it('does not leak nested-object references between getConfig() calls (deep)', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
      const a = m.getConfig();
      a.feature.flags.injected = 'tampered';
      const b = m.getConfig();
      assert.equal(b.feature.flags.injected, undefined);
    });
  });

  it('does not leak nested-object references between getConfig() calls (shallow)', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop'], { deepMerge: false });
      const a = m.getConfig();
      // In shallow mode the `feature` from develop replaces production's wholesale.
      // Mutating it must not bleed into the next call (i.e. into Node's module cache).
      a.feature.injected = 'tampered';
      const b = m.getConfig();
      assert.equal(b.feature.injected, undefined);
    });
  });

  it('does not leak array references between getConfig() calls', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
      const a = m.getConfig();
      a.list.push('tampered');
      const b = m.getConfig();
      assert.ok(!b.list.includes('tampered'));
    });
  });

  it('falls back to reference sharing for values structuredClone cannot copy', async () => {
    const dir = makeConfigDir({
      // Functions and WeakMaps are not cloneable. structuredClone throws on
      // the WeakMap; the loader catches and shares the reference rather than
      // failing the entire load.
      'production.js':
        'module.exports = { cache: new WeakMap(), handler: function fn(x) { return x; } };\n',
      'develop.js': 'module.exports = { other: true };\n',
    });
    try {
      await withCleanEnv(() => {
        process.env.NODE_ENV = 'develop';
        const cfg = new Mconf(dir, ['production', 'develop']).getConfig();
        assert.ok(cfg.cache instanceof WeakMap);
        assert.equal(typeof cfg.handler, 'function');
        assert.equal(cfg.handler('hi'), 'hi');
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('throws on an empty config dir', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'mconf-empty-'));
    try {
      mkdirSync(dir, { recursive: true });
      await withCleanEnv(() => {
        process.env.NODE_ENV = 'develop';
        const m = new Mconf(dir, ['production', 'develop']);
        assert.throws(() => m.getConfig(), /Mconf: config "production" not found at/);
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
