import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Mconf } from '../src/index.js';
import { CONFIGS_DIR } from './helpers/env.js';

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

  it('strips trailing slashes from configDir', () => {
    const m = new Mconf(`${CONFIGS_DIR}//`, ['develop']);
    assert.equal(m.configDir, CONFIGS_DIR);
  });

  it('does not allow external mutation of availableEnvs to leak in', () => {
    const list = ['develop'];
    const m = new Mconf(CONFIGS_DIR, list);
    list.push('rc');
    assert.deepEqual(m.availableEnvs, ['develop']);
  });
});
