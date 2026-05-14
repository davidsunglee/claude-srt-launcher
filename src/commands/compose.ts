import type { PolicyFragment, ProfileName, UnsafeOverride } from '../profiles/types.js';
import { getProfile } from '../profiles/index.js';
import { applyUnsafeOverrides } from '../overrides/unsafe.js';

export interface ParsedCli {
  subcommand: 'run' | 'exec' | 'bootstrap' | 'render';
  profile: ProfileName;
  workspace?: string;
  stateDir?: string;
  unsafeOverrides: Set<UnsafeOverride>;
  disposable: boolean;
  unattended: boolean;
  dryRun: boolean;
  userArgs: string[];
}

export function composeProfileFor(parsed: ParsedCli): PolicyFragment {
  const fragment =
    parsed.profile === 'build'
      ? getProfile('build', { withEgress: parsed.unsafeOverrides.has('build-with-egress') })
      : getProfile(parsed.profile);
  return applyUnsafeOverrides(fragment, parsed.unsafeOverrides);
}
