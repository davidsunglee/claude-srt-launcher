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

  it('includes github.com in allowedDomains (inherited from interactive)', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('github.com');
  });

  it('includes developer.apple.com in allowedDomains', () => {
    const profile = getProfile('ios');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('developer.apple.com');
  });
});
