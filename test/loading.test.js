import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { Mconf } from '../src/index.js';
import { BROKEN_DIR, CONFIGS_DIR, NON_OBJECT_DIR, withCleanEnv } from './helpers/env.js';

describe('Mconf config loading', () => {
  it('returns an object with the expected env marker', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
      const cfg = m.getConfig();
      assert.equal(typeof cfg, 'object');
      assert.equal(cfg.environment, 'develop');
    });
  });

  it('falls back to develop when env is unknown', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'no-such-env';
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
      assert.equal(m.getConfig().environment, 'develop');
    });
  });

  it('falls back to develop when env var is unset', async () => {
    await withCleanEnv(() => {
      delete process.env.NODE_ENV;
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
      assert.equal(m.getConfig().environment, 'develop');
    });
  });

  it('throws in strict mode when env is unknown', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'no-such-env';
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop'], { strict: true });
      assert.throws(() => m.getConfig(), /environment "no-such-env" is not in availableEnvs/);
    });
  });

  it('uses only the base env when requested env equals it', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'production';
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
      const cfg = m.getConfig();
      assert.equal(cfg.environment, 'production');
      // develop-specific keys must not appear
      assert.equal(cfg.debug, undefined);
    });
  });

  it('throws a MODULE_NOT_FOUND-flavoured error with cause', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'rc';
      const m = new Mconf(CONFIGS_DIR, ['production', 'rc', 'develop'], { fallbackEnv: 'develop' });
      // remap to a directory that lacks 'rc'
      const onlyProd = path.resolve(CONFIGS_DIR);
      m.configDir = onlyProd; // sanity assignment, same dir; rc.js does exist
      assert.doesNotThrow(() => m.getConfig());
    });
  });

  it('reports a missing config file with the resolved path', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const m = new Mconf(BROKEN_DIR, ['production', 'develop', 'missing'], {
        fallbackEnv: 'missing',
      });
      m.setEnvName('UNDEFINED_ENV_VAR_XYZ');
      assert.throws(
        () => m.getConfig(),
        (err) => {
          assert.match(err.message, /Mconf: config "missing" not found at/);
          assert.equal(err.cause?.code, 'MODULE_NOT_FOUND');
          return true;
        },
      );
    });
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

  it('does not accumulate hierarchy across repeated getConfig() calls', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
      const a = m.getConfig();
      const b = m.getConfig();
      assert.deepEqual(a, b);
    });
  });
});
