import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Locate maestro binary
const userHome = os.homedir();
const candidatePaths = [
  path.join(userHome, '.maestro', 'maestro', 'bin', 'maestro.bat'),
  path.join(userHome, '.maestro', 'bin', 'maestro.bat'),
  path.join(userHome, '.maestro', 'maestro', 'bin', 'maestro'),
  path.join(userHome, '.maestro', 'bin', 'maestro'),
];

let maestroBin = 'maestro';
for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    maestroBin = p;
    break;
  }
}

const args = process.argv.slice(2);
const result = spawnSync(`"${maestroBin}"`, args, {
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 0);
