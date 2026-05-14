import type { PolicyFragment, ProfileName } from './types.js';
import { BASE_POLICY } from './base.js';
import { INTERACTIVE_PROFILE } from './interactive.js';
import { compose } from '../policy/compose.js';

const profileMap: Record<string, PolicyFragment> = {
  interactive: INTERACTIVE_PROFILE,
};

export function getProfile(name: ProfileName): PolicyFragment {
  if (name === 'build' || name === 'inspect' || name === 'ios') {
    throw new Error(`Profile '${name}' not implemented`);
  }
  const profile = profileMap[name];
  if (profile === undefined) {
    throw new Error(`Unknown profile: ${name}`);
  }
  return compose([BASE_POLICY, profile]);
}
