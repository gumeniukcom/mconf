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

  it('does not expose any enumerable instance state', () => {
    const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);
    assert.deepEqual(Object.keys(m), []);
    // Sanity: nothing leaked via property descriptors either.
    assert.deepEqual(Object.getOwnPropertyNames(m), []);
  });

  it('coerces setDeepMerge argument to boolean (via observed merge behaviour)', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const m = new Mconf(CONFIGS_DIR, ['production', 'develop']);

      // Truthy non-boolean → deep merge: nested production keys must survive.
      m.setDeepMerge('yes');
      assert.equal(m.getConfig().feature.flags.a, 1);

      // Falsy non-boolean → shallow merge: production's `feature` is replaced.
      m.setDeepMerge(0);
      assert.equal(m.getConfig().feature.flags.a, undefined);
    });
  });

  it('options.envName is rejected when not a non-empty string', () => {
    assert.throws(
      () => new Mconf(CONFIGS_DIR, ['production', 'develop'], { envName: '' }),
      /options\.envName must be a non-empty string/,
    );
    assert.throws(
      () => new Mconf(CONFIGS_DIR, ['production', 'develop'], { envName: 42 }),
      /options\.envName must be a non-empty string/,
    );
  });
});
