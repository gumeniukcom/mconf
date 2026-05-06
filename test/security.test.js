import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { Mconf } from '../src/index.js';
import { withCleanEnv } from './helpers/env.js';

describe('Mconf security', () => {
  it('refuses to load env names outside the safe character set', () => {
    assert.throws(() => new Mconf('/tmp', ['../escape']), /availableEnvs entry .* is invalid/);
    assert.throws(() => new Mconf('/tmp', ['a b']), /availableEnvs entry .* is invalid/);
    assert.throws(() => new Mconf('/tmp', ['']), /availableEnvs entry .* is invalid/);
  });

  it('does not pollute Object.prototype via merged configs', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'mconf-proto-'));
    try {
      writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify({ type: 'commonjs', private: true }),
      );
      writeFileSync(path.join(dir, 'production.js'), 'module.exports = { ok: true };\n');
      writeFileSync(
        path.join(dir, 'develop.js'),
        `module.exports = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}');\n`,
      );

      await withCleanEnv(() => {
        process.env.NODE_ENV = 'develop';
        const cfg = new Mconf(dir, ['production', 'develop']).getConfig();
        assert.equal(cfg.polluted, undefined);
        assert.equal({}.polluted, undefined);
        assert.equal(Object.prototype.polluted, undefined);
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects non-string env names at runtime via setEnvName', () => {
    const m = new Mconf('/tmp', ['develop'], { baseEnv: 'develop', fallbackEnv: 'develop' });
    assert.throws(() => m.setEnvName(undefined), /envName must be a non-empty string/);
    assert.throws(() => m.setEnvName(123), /envName must be a non-empty string/);
  });

  it('does not allow loading siblings of the config dir via crafted env name', async () => {
    // Even if an attacker controls process.env.NODE_ENV, env names not in the
    // whitelist trigger the strict/fallback path and never reach the loader.
    const tmp = mkdtempSync(path.join(os.tmpdir(), 'mconf-sec-'));
    try {
      mkdirSync(path.join(tmp, 'configs'), { recursive: true });
      writeFileSync(
        path.join(tmp, 'configs', 'package.json'),
        JSON.stringify({ type: 'commonjs', private: true }),
      );
      writeFileSync(
        path.join(tmp, 'configs', 'production.js'),
        'module.exports = { source: "production" };\n',
      );
      writeFileSync(
        path.join(tmp, 'configs', 'develop.js'),
        'module.exports = { source: "develop" };\n',
      );
      writeFileSync(path.join(tmp, 'secret.js'), 'module.exports = { stolen: true };\n');

      await withCleanEnv(() => {
        process.env.NODE_ENV = '../secret';
        const m = new Mconf(path.join(tmp, 'configs'), ['production', 'develop'], {
          strict: true,
        });
        assert.throws(() => m.getConfig(), /not in availableEnvs/);
      });
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
