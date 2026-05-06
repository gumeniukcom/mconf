import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Mconf } from '../src/index.js';
import { CONFIGS_DIR, withCleanEnv } from './helpers/env.js';

describe('Mconf public API', () => {
  it('class has a useful name for stack traces', () => {
    assert.equal(Mconf.name, 'Mconf');
  });

  it('chains setEnvName and setDeepMerge', async () => {
    await withCleanEnv(() => {
      process.env.APP_ENV = 'develop';
      const cfg = new Mconf(CONFIGS_DIR, ['production', 'develop'])
        .setEnvName('APP_ENV')
        .setDeepMerge(true)
        .getConfig();
      assert.equal(cfg.environment, 'develop');
    });
  });

  it('does not expose private internals as enumerable properties', () => {
    const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
    const visible = Object.keys(m);
    // configDir, availableEnvs, baseEnv, fallbackEnv, strict are private fields.
    assert.deepEqual(visible.sort(), ['deepMerge', 'envName']);
  });

  it('coerces setDeepMerge argument to boolean', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
      m.setDeepMerge(0);
      assert.equal(m.deepMerge, false);
      m.setDeepMerge('yes');
      assert.equal(m.deepMerge, true);
    });
  });
});
