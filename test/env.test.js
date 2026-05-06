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

  it('honours setEnvName', async () => {
    await withCleanEnv(() => {
      process.env.MAIL_ENV = 'rc';
      const m = new Mconf(CONFIGS_DIR, ['production', 'rc', 'develop']).setEnvName('MAIL_ENV');
      assert.equal(m.getEnvironmentFromGlobalEnv(), 'rc');
    });
  });

  it('exposes setEnv as alias of setEnvName', async () => {
    await withCleanEnv(() => {
      process.env.APP_ENV = 'develop';
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop']).setEnv('APP_ENV');
      assert.equal(m.envName, 'APP_ENV');
      assert.equal(m.getEnvironmentFromGlobalEnv(), 'develop');
    });
  });

  it('rejects empty envName', () => {
    const m = new Mconf(CONFIGS_DIR, ['develop']);
    assert.throws(() => m.setEnvName(''), /envName must be a non-empty string/);
  });

  it('_isEnvironmentAvailable reports membership', () => {
    const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
    assert.equal(m._isEnvironmentAvailable('production'), true);
    assert.equal(m._isEnvironmentAvailable('staging'), false);
    assert.equal(m._isEnvironmentAvailable(undefined), false);
  });
});
