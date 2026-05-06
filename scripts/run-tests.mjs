// Cross-platform test runner.
//
// `node --test` does not expand globs on its own across all supported Node
// versions, and bare directories interact badly with the auto-discovery
// patterns that walk into test/fixtures. Discover the test files in JS
// instead and pass them to `node --test` as explicit positional arguments.

import { readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const testDir = path.resolve(here, '..', 'test');

const files = readdirSync(testDir, { withFileTypes: true })
  .filter((d) => d.isFile() && d.name.endsWith('.test.js'))
  .map((d) => path.join(testDir, d.name))
  .sort();

if (files.length === 0) {
  console.error('No *.test.js files found in', testDir);
  process.exitCode = 1;
} else {
  const child = spawn(process.execPath, ['--test', '--test-reporter=spec', ...files], {
    stdio: 'inherit',
  });

  child.on('close', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exitCode = code ?? 0;
    }
  });
}
