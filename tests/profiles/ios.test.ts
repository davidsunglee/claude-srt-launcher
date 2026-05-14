import { describe, it, expect } from 'vitest';
import { substitute } from '../../src/policy/substitute.js';
import { toRendered } from '../../src/policy/render.js';
import { getProfile } from '../../src/profiles/index.js';

const subs = { workspace: '/ws', claudeState: '/state', tmpdir: '/tmp', home: '/home/u' };

describe('ios profile', () => {
  it('includes /Applications/Xcode.app in allowRead', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).toContain('/Applications/Xcode.app');
  });

  it('includes ~/Library/Developer/Xcode in allowRead after substitution', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).toContain('/home/u/Library/Developer/Xcode');
  });

  it('includes ~/Library/Developer/CoreSimulator in allowRead after substitution', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).toContain('/home/u/Library/Developer/CoreSimulator');
  });

  it('includes ~/Library/Developer/Xcode/DerivedData in allowWrite after substitution', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).toContain('/home/u/Library/Developer/Xcode/DerivedData');
  });

  it('includes ~/Library/Developer/CoreSimulator/Devices in allowWrite after substitution', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).toContain('/home/u/Library/Developer/CoreSimulator/Devices');
  });

  it('inherits ~/Library/Keychains in denyRead from base after substitution', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.denyRead).toContain('/home/u/Library/Keychains');
  });

  it('includes ~/Library/MobileDevice/Provisioning Profiles in denyRead after substitution', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.denyRead).toContain('/home/u/Library/MobileDevice/Provisioning Profiles');
  });

  it('includes com.apple.iphonesimulator.* in allowMachLookup', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowMachLookup).toContain('com.apple.iphonesimulator.*');
  });

  it('includes github.com in allowedDomains for SwiftPM Git fetches', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('github.com');
  });

  it('includes developer.apple.com in allowedDomains', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('developer.apple.com');
  });

  it('includes <workspace> in allowRead and allowWrite after substitution', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).toContain('/ws');
    expect(rendered.filesystem.allowWrite).toContain('/ws');
  });

  it('includes <claude-state> in allowRead and allowWrite after substitution', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).toContain('/state');
    expect(rendered.filesystem.allowWrite).toContain('/state');
  });

  it('includes /tmp and $TMPDIR in allowWrite after substitution', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).toContain('/tmp');
  });

  it('excludes ~/.npm from allowRead and allowWrite after substitution', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).not.toContain('/home/u/.npm');
    expect(rendered.filesystem.allowWrite).not.toContain('/home/u/.npm');
  });

  it('excludes ~/Library/pnpm from allowRead and allowWrite after substitution', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).not.toContain('/home/u/Library/pnpm');
    expect(rendered.filesystem.allowWrite).not.toContain('/home/u/Library/pnpm');
  });

  it('excludes ~/Library/Caches/pnpm from allowRead and allowWrite after substitution', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).not.toContain('/home/u/Library/Caches/pnpm');
    expect(rendered.filesystem.allowWrite).not.toContain('/home/u/Library/Caches/pnpm');
  });

  it('excludes ~/.yarn, ~/.cargo, ~/.rustup, ~/.rbenv, ~/.pyenv, ~/go from allowRead', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).not.toContain('/home/u/.yarn');
    expect(rendered.filesystem.allowRead).not.toContain('/home/u/.cargo');
    expect(rendered.filesystem.allowRead).not.toContain('/home/u/.rustup');
    expect(rendered.filesystem.allowRead).not.toContain('/home/u/.rbenv');
    expect(rendered.filesystem.allowRead).not.toContain('/home/u/.pyenv');
    expect(rendered.filesystem.allowRead).not.toContain('/home/u/go');
  });

  it('excludes registry.npmjs.org from allowedDomains', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).not.toContain('registry.npmjs.org');
  });

  it('excludes registry.yarnpkg.com from allowedDomains', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).not.toContain('registry.yarnpkg.com');
  });

  it('excludes pypi.org, crates.io, rubygems.org, proxy.golang.org from allowedDomains', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).not.toContain('pypi.org');
    expect(rendered.network.allowedDomains).not.toContain('files.pythonhosted.org');
    expect(rendered.network.allowedDomains).not.toContain('crates.io');
    expect(rendered.network.allowedDomains).not.toContain('static.crates.io');
    expect(rendered.network.allowedDomains).not.toContain('rubygems.org');
    expect(rendered.network.allowedDomains).not.toContain('proxy.golang.org');
    expect(rendered.network.allowedDomains).not.toContain('sum.golang.org');
    expect(rendered.network.allowedDomains).not.toContain('repo.maven.apache.org');
    expect(rendered.network.allowedDomains).not.toContain('repo1.maven.org');
  });

  it('excludes Docker registry domains from allowedDomains', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).not.toContain('auth.docker.io');
    expect(rendered.network.allowedDomains).not.toContain('registry-1.docker.io');
    expect(rendered.network.allowedDomains).not.toContain('index.docker.io');
    expect(rendered.network.allowedDomains).not.toContain('production.cloudflare.docker.com');
  });

  it('retains package-registry.swift.org in allowedDomains', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('package-registry.swift.org');
  });

  it('retains codeload.github.com in allowedDomains for SwiftPM tarball fetches', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('codeload.github.com');
  });
});
