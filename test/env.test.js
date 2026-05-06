import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Mconf } from '../src/index.js';
import { CONFIGS_DIR, withCleanEnv } from './helpers/env.js';

describe('Mconf environment detection', () => {
  it('reads NODE_ENV by default', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'rc';
      const m = new Mconf(CONFIGS_DIR, ['production', 'rc', 'develop']);
      assert.equal(m.getEnvironmentFromGlobalEnv(), 'rc');
    });
  });

  it('returns undefined when env var is unset', async () => {
    await withCleanEnv(() => {
      delete process.env.NODE_ENV;
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
      assert.equal(m.getEnvironmentFromGlobalEnv(), undefined);
    });
  });

  it('honours setEnvName for env detection in getConfig()', async () => {
    await withCleanEnv(() => {
      process.env.MAIL_ENV = 'rc';
      const m = new Mconf(CONFIGS_DIR, ['production', 'rc', 'develop']).setEnvName('MAIL_ENV');
      assert.equal(m.getConfig().environment, 'rc');
    });
  });

  it('rejects empty envName via setEnvName', () => {
    const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
    assert.throws(() => m.setEnvName(''), /envName must be a non-empty string/);
  });

  it('accepts envName via constructor option', async () => {
    await withCleanEnv(() => {
      process.env.APP_ENV = 'develop';
      const cfg = new Mconf(CONFIGS_DIR, ['production', 'develop'], {
        envName: 'APP_ENV',
      }).getConfig();
      assert.equal(cfg.environment, 'develop');
    });
  });

  it('throws in strict mode (default) when env is unknown', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'no-such-env';
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
      assert.throws(() => m.getConfig(), /not in availableEnvs/);
    });
  });

  it('falls back to develop when strict is disabled and env is unknown', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'no-such-env';
      const cfg = new Mconf(CONFIGS_DIR, ['production', 'develop'], {
        strict: false,
      }).getConfig();
      assert.equal(cfg.environment, 'develop');
    });
  });
});
