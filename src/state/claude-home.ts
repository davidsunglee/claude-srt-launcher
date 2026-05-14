import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';

export interface ResolveOpts {
  stateRoot?: string;
}

export function resolveClaudeStateDir(
  profile: string,
  opts?: ResolveOpts
): string {
  const stateRoot =
    opts?.stateRoot ?? path.join(os.homedir(), '.claude-srt-launcher', 'state');
  return path.join(stateRoot, profile);
}

export async function ensureClaudeStateDir(stateDir: string): Promise<void> {
  await fs.mkdir(stateDir, { recursive: true, mode: 0o700 });
  await fs.mkdir(path.join(stateDir, '.claude'), { recursive: true, mode: 0o700 });
}

export function claudeConfigDirFor(stateDir: string): string {
  return path.join(stateDir, '.claude');
}

export function assertNotHostClaudeHome(
  stateDir: string,
  granted: Set<string>
): void {
  if (granted.has('host-claude-home')) {
    return;
  }

  const hostClaudeHome = path.join(os.homedir(), '.claude');
  const hostClaudeParent = path.dirname(hostClaudeHome);

  // Normalize paths for comparison
  const normalizedStateDir = path.resolve(stateDir);
  const normalizedClaudeHome = path.resolve(hostClaudeHome);
  const normalizedClaudeParent = path.resolve(hostClaudeParent);

  if (
    normalizedStateDir === normalizedClaudeHome ||
    normalizedStateDir === normalizedClaudeParent
  ) {
    throw new Error(
      `State directory cannot be ${hostClaudeHome} or its parent directory ` +
      `without the host-claude-home grant`
    );
  }
}
