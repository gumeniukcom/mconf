import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Mconf } from '../src/index.js';
import { CONFIGS_DIR, withCleanEnv } from './helpers/env.js';

describe('Mconf public API', () => {
  it('class has a useful name for stack traces', () => {
    assert.equal(Mconf.name, 'Mconf');
  });

  it('chains setEnvName, setEnv, and setDeepMerge', async () => {
    await withCleanEnv(() => {
      process.env.APP_ENV = 'develop';
      const cfg = new Mconf(CONFIGS_DIR, ['production', 'develop'])
        .setEnv('APP_ENV')
        .setEnvName('APP_ENV')
        .setDeepMerge(true)
        .getConfig();
      assert.equal(cfg.environment, 'develop');
    });
  });

  it('coerces setDeepMerge argument to boolean', () => {
    const m = new Mconf(CONFIGS_DIR, ['develop']);
    m.setDeepMerge(0);
    assert.equal(m.deepMerge, false);
    m.setDeepMerge('yes');
    assert.equal(m.deepMerge, true);
  });
});
