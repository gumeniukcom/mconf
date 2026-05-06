/**
 * Snapshot/restore process.env around a test so tests cannot leak state.
 * @param {() => void | Promise<void>} fn
 */
export async function withCleanEnv(fn) {
  const snapshot = { ...process.env };
  try {
    await fn();
  } finally {
    for (const key of Object.keys(process.env)) {
      if (!(key in snapshot)) delete process.env[key];
    }
    for (const [key, value] of Object.entries(snapshot)) {
      process.env[key] = value;
    }
  }
}

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const FIXTURES = path.resolve(here, '..', 'fixtures');
export const CONFIGS_DIR = path.join(FIXTURES, 'configs');
export const BROKEN_DIR = path.join(FIXTURES, 'broken');
export const NON_OBJECT_DIR = path.join(FIXTURES, 'non-object');
