import type { PolicyFragment } from './types.js';

export const INSPECT_PROFILE: PolicyFragment = {
  network: {
    allowedDomains: [
      'api.github.com',
      'raw.githubusercontent.com',
      'codeload.github.com',
    ],
  },
  filesystem: {
    allowRead: [
      '<workspace>',
      '<claude-state>',
      '~/.cache',
    ],
    allowWrite: [
      '<workspace>/test-output',
      '<workspace>/reports',
      '<workspace>/.cache',
      '~/.cache',
      '<claude-state>',
      '/tmp',
      '$TMPDIR',
    ],
  },
};
