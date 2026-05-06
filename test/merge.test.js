import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Mconf } from '../src/index.js';
import { CONFIGS_DIR, withCleanEnv } from './helpers/env.js';

describe('Mconf merge strategy', () => {
  it('deep-merges layers by default', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const cfg = new Mconf(CONFIGS_DIR, ['production', 'develop']).getConfig();
      assert.equal(cfg.service, 'mconf-test'); // inherited from production
      assert.equal(cfg.port, 3000); // overridden by develop
      assert.equal(cfg.feature.enabled, true);
      assert.deepEqual(cfg.feature.flags, { a: 1, b: 22, c: 3 });
      assert.deepEqual(cfg.list, ['dev-only']); // arrays are replaced, not concatenated
      assert.equal(cfg.debug, true);
      assert.equal(cfg.environment, 'develop');
    });
  });

  it('shallow-merges layers when deepMerge is disabled', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const cfg = new Mconf(CONFIGS_DIR, ['production', 'develop']).setDeepMerge(false).getConfig();
      assert.equal(cfg.service, 'mconf-test');
      assert.equal(cfg.port, 3000);
      // feature is fully replaced — flag.a from production must be gone
      assert.deepEqual(cfg.feature, { enabled: true, flags: { b: 22, c: 3 } });
      assert.equal(cfg.environment, 'develop');
    });
  });

  it('passes deepMerge through constructor options', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const cfg = new Mconf(CONFIGS_DIR, ['production', 'develop'], {
        deepMerge: false,
      }).getConfig();
      assert.deepEqual(cfg.feature, { enabled: true, flags: { b: 22, c: 3 } });
    });
  });
});
