import type { PolicyFragment } from './types.js';
import { GITHUB_GIT_FETCH_DOMAINS } from './github-git.js';

export const IOS_PROFILE: PolicyFragment = {
  network: {
    allowedDomains: [
      ...GITHUB_GIT_FETCH_DOMAINS,
      'developer.apple.com',
      'xcode.apple.com',
      'swcdn.apple.com',
      'updates.cdn-apple.com',
      'gs.apple.com',
      'gsa.apple.com',
      'devimages.apple.com',
      'devimages-cdn.apple.com',
      '*.mzstatic.com',
      'package-registry.swift.org',
    ],
    allowMachLookup: [
      'com.apple.iphonesimulator.*',
      'com.apple.CoreSimulator.*',
      'com.apple.dt.Xcode.*',
    ],
  },
  filesystem: {
    allowRead: [
      '<workspace>',
      '<claude-state>',
      '/Applications/Xcode.app',
      '/Library/Developer',
      '~/Library/Developer/Xcode',
      '~/Library/Developer/CoreSimulator',
      '~/Library/Caches/com.apple.dt.Xcode',
      '~/Library/Caches/org.swift.swiftpm',
      '~/Library/Caches/com.apple.iphonesimulator',
      '~/Library/Preferences/com.apple.dt.Xcode.plist',
      '/Library/Developer/CommandLineTools',
    ],
    allowWrite: [
      '<workspace>',
      '<claude-state>',
      '~/Library/Developer/Xcode/DerivedData',
      '~/Library/Developer/CoreSimulator/Devices',
      '~/Library/Caches/com.apple.dt.Xcode',
      '~/Library/Caches/org.swift.swiftpm',
      '~/Library/Caches/com.apple.iphonesimulator',
      '~/Library/Logs/CoreSimulator',
      '/tmp',
      '$TMPDIR',
    ],
    denyRead: [
      '~/Library/MobileDevice/Provisioning Profiles',
      '~/Library/MobileDevice/Devices',
    ],
  },
};
