import type { ProfileName } from '../profiles/types.js';

export function buildClaudeArgs(opts: {
  profile: ProfileName;
  unattended: boolean;
  userArgs: string[];
}): string[] {
  const { profile, unattended, userArgs } = opts;
  if (profile === 'build' && unattended) {
    return ['claude', '--dangerously-skip-permissions', ...userArgs];
  }
  return ['claude', ...userArgs];
}
