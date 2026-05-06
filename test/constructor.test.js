import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Mconf } from '../src/index.js';
import { CONFIGS_DIR, withCleanEnv } from './helpers/env.js';

describe('Mconf constructor', () => {
  it('throws when configDir is missing', () => {
    assert.throws(() => new Mconf(), /configDir must be a non-empty string/);
  });

  it('throws when configDir is empty string', () => {
    assert.throws(() => new Mconf('', ['develop']), /configDir must be a non-empty string/);
  });

  it('throws when availableEnvs is missing', () => {
    assert.throws(() => new Mconf(CONFIGS_DIR), /availableEnvs must be an array/);
  });

  it('throws when availableEnvs is not an array (object)', () => {
    assert.throws(() => new Mconf(CONFIGS_DIR, { foo: 'bar' }), /availableEnvs must be an array/);
  });

  it('throws when availableEnvs is not an array (string)', () => {
    assert.throws(() => new Mconf(CONFIGS_DIR, 'develop'), /availableEnvs must be an array/);
  });

  it('throws when availableEnvs is empty', () => {
    assert.throws(
      () => new Mconf(CONFIGS_DIR, []),
      /availableEnvs must contain at least one entry/,
    );
  });

  it('throws when availableEnvs contains duplicates', () => {
    assert.throws(
      () => new Mconf(CONFIGS_DIR, ['production', 'production', 'develop']),
      /availableEnvs must not contain duplicates/,
    );
  });

  it('throws when an env name contains path traversal', () => {
    assert.throws(
      () => new Mconf(CONFIGS_DIR, ['../etc/passwd']),
      /availableEnvs entry .* is invalid/,
    );
  });

  it('throws when an env name contains slashes', () => {
    assert.throws(() => new Mconf(CONFIGS_DIR, ['a/b']), /availableEnvs entry .* is invalid/);
  });

  it('throws when options.baseEnv is unsafe', () => {
    assert.throws(
      () => new Mconf(CONFIGS_DIR, ['develop'], { baseEnv: '../bad' }),
      /options\.baseEnv .* is invalid/,
    );
  });

  it('throws when options.baseEnv is not a member of availableEnvs', () => {
    assert.throws(
      () => new Mconf(CONFIGS_DIR, ['develop'], { baseEnv: 'production', fallbackEnv: 'develop' }),
      /options\.baseEnv "production" must be one of availableEnvs/,
    );
  });

  it('throws when options.fallbackEnv is not a member of availableEnvs', () => {
    assert.throws(
      () =>
        new Mconf(CONFIGS_DIR, ['production'], {
          baseEnv: 'production',
          fallbackEnv: 'staging',
        }),
      /options\.fallbackEnv "staging" must be one of availableEnvs/,
    );
  });

  it('uses default production/develop layering when both are present', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const cfg = new Mconf(CONFIGS_DIR, ['production', 'develop']).getConfig();
      assert.equal(cfg.environment, 'develop');
    });
  });

  it('handles trailing slashes in configDir', async () => {
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'develop';
      const cfg = new Mconf(`${CONFIGS_DIR}//`, ['production', 'develop']).getConfig();
      assert.equal(cfg.environment, 'develop');
    });
  });

  it('does not allow external mutation of availableEnvs to leak in', async () => {
    const list = ['production', 'develop'];
    const m = new Mconf(CONFIGS_DIR, list);
    list.push('rc');
    await withCleanEnv(() => {
      process.env.NODE_ENV = 'rc';
      assert.throws(() => m.getConfig(), /not in availableEnvs/);
    });
  });
});
