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

  it('does NOT grant broad /tmp write (would bypass workspace-root deny for temp workspaces)', () => {
    const profile = getProfile('inspect');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).not.toContain('/tmp');
  });

  it('does NOT grant broad $TMPDIR write (would bypass workspace-root deny for temp workspaces)', () => {
    const profile = getProfile('inspect');
    const tmpdir = '/private/var/folders/zz/tmp';
    const rendered = toRendered(substitute(profile, { ...subs, tmpdir }));
    expect(rendered.filesystem.allowWrite).not.toContain(tmpdir);
  });

  it('does NOT permit workspace-root writes when workspace lives under os.tmpdir()', () => {
    const profile = getProfile('inspect');
    const wsUnderTmp = '/tmp/claude-srt-smoke.abc/ws';
    const rendered = toRendered(
      substitute(profile, { workspace: wsUnderTmp, claudeState: '/state', tmpdir: '/tmp', home: '/home/u' })
    );
    // workspace-root must NOT be implicitly writable through any allowWrite entry
    for (const entry of rendered.filesystem.allowWrite) {
      // an allowWrite entry "covers" the workspace root iff entry === wsUnderTmp
      // or wsUnderTmp.startsWith(entry + '/'), which is the rule sandbox-runtime uses.
      const covers = entry === wsUnderTmp || wsUnderTmp.startsWith(entry + '/');
      expect(covers, `entry "${entry}" must not grant write to workspace root "${wsUnderTmp}"`).toBe(false);
    }
  });
});
