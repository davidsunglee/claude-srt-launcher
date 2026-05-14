import type { ProfileName } from '../profiles/types.js';

const DANGEROUS_FLAG = '--dangerously-skip-permissions';

export class DangerousFlagNotAllowedError extends Error {
  constructor(profile: ProfileName, unattended: boolean) {
    super(
      `${DANGEROUS_FLAG} is only allowed with --profile build and --unattended ` +
        `(got --profile ${profile}${unattended ? ' --unattended' : ''}); ` +
        'remove it from user args.',
    );
    this.name = 'DangerousFlagNotAllowedError';
  }
}

export function buildClaudeArgs(opts: {
  profile: ProfileName;
  unattended: boolean;
  userArgs: string[];
}): string[] {
  const { profile, unattended, userArgs } = opts;
  const gated = profile === 'build' && unattended;
  const isDangerousFlag = (a: string): boolean =>
    a === DANGEROUS_FLAG || a.startsWith(`${DANGEROUS_FLAG}=`);
  if (!gated && userArgs.some(isDangerousFlag)) {
    throw new DangerousFlagNotAllowedError(profile, unattended);
  }
  if (gated) {
    return ['claude', DANGEROUS_FLAG, ...userArgs.filter((a) => !isDangerousFlag(a))];
  }
  return ['claude', ...userArgs];
}
