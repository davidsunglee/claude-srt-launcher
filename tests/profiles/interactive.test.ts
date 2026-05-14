import { describe, it, expect } from 'vitest';
import { substitute } from '../../src/policy/substitute.js';
import { toRendered } from '../../src/policy/render.js';
import { getProfile } from '../../src/profiles/index.js';

const subs = { workspace: '/ws', claudeState: '/state', tmpdir: '/tmp', home: '/home/u' };

describe('interactive profile', () => {
  it('includes github.com in allowedDomains', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('github.com');
  });

  it('includes *.github.com in allowedDomains', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('*.github.com');
  });

  it('includes registry.npmjs.org in allowedDomains', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('registry.npmjs.org');
  });

  it('inherits api.anthropic.com from base', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('api.anthropic.com');
  });

  it('includes /ws in allowRead after substitution', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).toContain('/ws');
  });

  it('includes /state in allowRead after substitution', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).toContain('/state');
  });

  it('includes /ws in allowWrite after substitution', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).toContain('/ws');
  });

  it('includes /state in allowWrite after substitution', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).toContain('/state');
  });

  it('inherits /home/u/.ssh in denyRead from base', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.denyRead).toContain('/home/u/.ssh');
  });

  it('allowLocalBinding is false', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowLocalBinding).toBe(false);
  });

  it('allowAllUnixSockets is false', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowAllUnixSockets).toBe(false);
  });

  it('includes ~/Library/pnpm in allowRead after substitution', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).toContain('/home/u/Library/pnpm');
  });

  it('includes ~/Library/Caches/pnpm in allowRead after substitution', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).toContain('/home/u/Library/Caches/pnpm');
  });

  it('includes ~/Library/pnpm in allowWrite after substitution', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).toContain('/home/u/Library/pnpm');
  });

  it('includes ~/Library/Caches/pnpm in allowWrite after substitution', () => {
    const profile = getProfile('interactive');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).toContain('/home/u/Library/Caches/pnpm');
  });
});
