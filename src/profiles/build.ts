import type { PolicyFragment } from './types.js';
import { DEV_EGRESS_DOMAINS } from './dev-egress.js';

export const BUILD_PROFILE: PolicyFragment = {
  filesystem: {
    allowRead: ['<workspace>', '<claude-state>', '~/.npm', '~/.cache'],
    allowWrite: ['<workspace>', '<claude-state>', '/tmp', '$TMPDIR'],
  },
};

export const BUILD_WITH_EGRESS_FRAGMENT: PolicyFragment = {
  network: {
    allowedDomains: DEV_EGRESS_DOMAINS,
  },
};
