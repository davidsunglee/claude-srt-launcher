import { describe, it, expect } from 'vitest';
import { substitute } from '../../src/policy/substitute.js';
import { toRendered } from '../../src/policy/render.js';
import { getProfile } from '../../src/profiles/index.js';

const subs = { workspace: '/ws', claudeState: '/state', tmpdir: '/tmp', home: '/home/u' };

describe('inspect profile', () => {
  it('includes /ws in allowRead after substitution', () => {
    const profile = getProfile('inspect');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).toContain('/ws');
  });

  it('includes /ws/test-output in allowWrite after substitution', () => {
    const profile = getProfile('inspect');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).toContain('/ws/test-output');
  });

  it('includes /ws/reports in allowWrite after substitution', () => {
    const profile = getProfile('inspect');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).toContain('/ws/reports');
  });

  it('includes /ws/.cache in allowWrite after substitution', () => {
    const profile = getProfile('inspect');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).toContain('/ws/.cache');
  });

  it('does NOT include workspace root /ws in allowWrite', () => {
    const profile = getProfile('inspect');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).not.toContain('/ws');
  });

  it('includes api.github.com in allowedDomains', () => {
    const profile = getProfile('inspect');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('api.github.com');
  });

  it('does NOT include registry.npmjs.org in allowedDomains', () => {
    const profile = getProfile('inspect');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).not.toContain('registry.npmjs.org');
  });

  it('inherits api.anthropic.com from base', () => {
    const profile = getProfile('inspect');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('api.anthropic.com');
  });

  it('grants /tmp write so inspect workloads can use the system temp directory', () => {
    const profile = getProfile('inspect');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).toContain('/tmp');
  });

  it('grants $TMPDIR write after substitution', () => {
    const profile = getProfile('inspect');
    const tmpdir = '/private/var/folders/zz/tmp';
    const rendered = toRendered(substitute(profile, { ...subs, tmpdir }));
    expect(rendered.filesystem.allowWrite).toContain(tmpdir);
  });
});
