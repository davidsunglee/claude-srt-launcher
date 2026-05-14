import { GITHUB_GIT_FETCH_DOMAINS } from './github-git.js';

export const DEV_EGRESS_DOMAINS: string[] = [
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
];
