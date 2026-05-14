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

/**
 * Returns the directory that should be used as Claude's config home
 * (i.e. the value substituted for <claude-state> and exported as
 * CLAUDE_CONFIG_DIR). When the host-claude-home unsafe override is
 * granted, this is the host ~/.claude directory; otherwise it is the
 * isolated .claude subdirectory inside the per-profile state dir.
 */
export function resolveClaudeConfigDir(
  stateDir: string,
  granted: ReadonlySet<string>
): string {
  if (granted.has('host-claude-home')) {
    return path.join(os.homedir(), '.claude');
  }
  return claudeConfigDirFor(stateDir);
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
