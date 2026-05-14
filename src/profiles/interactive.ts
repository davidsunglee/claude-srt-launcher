import type { PolicyFragment } from './types.js';
import { GITHUB_GIT_FETCH_DOMAINS } from './github-git.js';

export const INTERACTIVE_PROFILE: PolicyFragment = {
  network: {
    allowedDomains: [
      ...GITHUB_GIT_FETCH_DOMAINS,
      'registry.npmjs.org',
      'registry.yarnpkg.com',
      'pypi.org',
      'files.pythonhosted.org',
      'crates.io',
      'static.crates.io',
      'proxy.golang.org',
      'sum.golang.org',
      'rubygems.org',
      'repo.maven.apache.org',
      'repo1.maven.org',
      'auth.docker.io',
      'registry-1.docker.io',
      'index.docker.io',
      'production.cloudflare.docker.com',
    ],
  },
  filesystem: {
    allowRead: [
      '<workspace>',
      '<claude-state>',
      '~/.npm',
      '~/Library/pnpm',
      '~/Library/Caches/pnpm',
      '~/.yarn',
      '~/.cache',
      '~/.cargo',
      '~/.rustup',
      '~/.rbenv',
      '~/.pyenv',
      '~/go',
    ],
    allowWrite: [
      '<workspace>',
      '<claude-state>',
      '~/.npm',
      '~/Library/pnpm',
      '~/Library/Caches/pnpm',
      '~/.yarn',
      '~/.cache',
      '~/.cargo',
      '/tmp',
      '$TMPDIR',
    ],
  },
};
