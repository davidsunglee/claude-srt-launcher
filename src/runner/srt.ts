import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export function findSrtBinary(): string {
  const dirs = (process.env.PATH ?? '').split(path.delimiter);
  for (const dir of dirs) {
    const candidate = path.join(dir, 'srt');
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      // not found or not executable in this dir
    }
  }
  throw new Error(
    'srt binary not found on PATH. Install with: npm install -g @anthropic-ai/sandbox-runtime',
  );
}

export async function runSrt(opts: {
  settingsPath: string;
  command: string[];
  env: NodeJS.ProcessEnv;
  signal?: AbortSignal;
}): Promise<{ exitCode: number | null; signal: NodeJS.Signals | null }> {
  const srtBin = findSrtBinary();
  const { settingsPath, command, env } = opts;

  try {
    const child = spawn(srtBin, ['--settings', settingsPath, ...command], {
      stdio: 'inherit',
      env,
    });

    const sigintHandler = () => child.kill('SIGINT');
    const sigtermHandler = () => child.kill('SIGTERM');
    process.on('SIGINT', sigintHandler);
    process.on('SIGTERM', sigtermHandler);

    return await new Promise((resolve, reject) => {
      child.on('error', (err) => {
        process.off('SIGINT', sigintHandler);
        process.off('SIGTERM', sigtermHandler);
        reject(err);
      });
      child.on('close', (code, sig) => {
        process.off('SIGINT', sigintHandler);
        process.off('SIGTERM', sigtermHandler);
        resolve({ exitCode: code, signal: sig as NodeJS.Signals | null });
      });
    });
  } finally {
    await fs.promises.rm(path.dirname(settingsPath), { recursive: true, force: true });
  }
}
