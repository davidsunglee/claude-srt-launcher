import type { PolicyFragment } from './types.js';

const SENSITIVE_PATHS = [
  '~/.ssh',
  '~/.aws',
  '~/.gnupg',
  '~/.gcloud',
  '~/.config/gcloud',
  '~/.azure',
  '~/.kube',
  '~/.docker',
  '~/.config/gh',
  '~/.config/op',
  '~/.netrc',
  '~/Library/Keychains',
  '~/Library/Group Containers/2BUA8C4S2C.com.1password',
  '~/Library/Application Support/Google/Chrome',
  '~/Library/Application Support/Firefox',
  '~/Library/Safari',
  '~/Library/Cookies',
  '~/Library/Mail',
  '~/.claude',
];

export const BASE_POLICY: PolicyFragment = {
  network: {
    allowedDomains: [
      'api.anthropic.com',
      'statsig.anthropic.com',
      'console.anthropic.com',
      'claude.ai',
      '*.claude.ai',
      'sentry.io',
      '*.sentry.io',
    ],
    allowLocalBinding: false,
    allowAllUnixSockets: false,
    allowUnixSockets: [],
    allowMachLookup: [
      'com.apple.SecurityServer',
      'com.apple.system.opendirectoryd.api',
      'com.apple.fonts',
    ],
  },
  filesystem: {
    denyRead: [...SENSITIVE_PATHS],
    denyWrite: [...SENSITIVE_PATHS],
  },
  enableWeakerNestedSandbox: false,
  enableWeakerNetworkIsolation: false,
};
