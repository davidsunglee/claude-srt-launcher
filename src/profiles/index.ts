import type { PolicyFragment, ProfileName } from './types.js';
import { BASE_POLICY } from './base.js';
import { INTERACTIVE_PROFILE } from './interactive.js';
import { INSPECT_PROFILE } from './inspect.js';
import { IOS_PROFILE } from './ios.js';
import { BUILD_PROFILE, BUILD_WITH_EGRESS_FRAGMENT } from './build.js';
import { compose } from '../policy/compose.js';

const profileMap: Record<string, PolicyFragment> = {
  interactive: INTERACTIVE_PROFILE,
  inspect: INSPECT_PROFILE,
  ios: compose([INTERACTIVE_PROFILE, IOS_PROFILE]),
};

export function getProfile(name: ProfileName, opts?: { withEgress?: boolean }): PolicyFragment {
  if (name === 'build') {
    return compose([BASE_POLICY, BUILD_PROFILE, opts?.withEgress ? BUILD_WITH_EGRESS_FRAGMENT : {}]);
  }
  const profile = profileMap[name];
  if (profile === undefined) {
    throw new Error(`Unknown profile: ${name}`);
  }
  return compose([BASE_POLICY, profile]);
}
