import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { mkdtempSync, writeFileSync } from 'fs';
import { join } from 'path';
import { substitute } from '../../src/policy/substitute.js';
import { toRendered } from '../../src/policy/render.js';
import { getProfile } from '../../src/profiles/index.js';
import { assertDisposableWorkspace, WorkspaceNotDisposableError } from '../../src/state/workspace.js';

const subs = { workspace: '/ws', claudeState: '/state', tmpdir: '/tmp', home: '/home/u' };

describe('build profile — default (no egress)', () => {
  it('does not include github.com in allowedDomains', () => {
    const profile = getProfile('build');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).not.toContain('github.com');
  });

  it('does not include registry.npmjs.org in allowedDomains', () => {
    const profile = getProfile('build');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).not.toContain('registry.npmjs.org');
  });

  it('includes api.anthropic.com in allowedDomains', () => {
    const profile = getProfile('build');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('api.anthropic.com');
  });

  it('includes /ws in allowRead after substitution', () => {
    const profile = getProfile('build');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).toContain('/ws');
  });

  it('includes /ws in allowWrite after substitution', () => {
    const profile = getProfile('build');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).toContain('/ws');
  });

  it('includes ~/Library/pnpm in allowRead after substitution', () => {
    const profile = getProfile('build');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).toContain('/home/u/Library/pnpm');
  });

  it('includes ~/Library/Caches/pnpm in allowRead after substitution', () => {
    const profile = getProfile('build');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowRead).toContain('/home/u/Library/Caches/pnpm');
  });

  it('does not include ~/Library/pnpm in allowWrite after substitution', () => {
    const profile = getProfile('build');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).not.toContain('/home/u/Library/pnpm');
  });

  it('does not include ~/Library/Caches/pnpm in allowWrite after substitution', () => {
    const profile = getProfile('build');
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.filesystem.allowWrite).not.toContain('/home/u/Library/Caches/pnpm');
  });
});

describe('build profile — with egress', () => {
  it('includes github.com in allowedDomains', () => {
    const profile = getProfile('build', { withEgress: true });
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('github.com');
  });

  it('includes registry.npmjs.org in allowedDomains', () => {
    const profile = getProfile('build', { withEgress: true });
    const rendered = toRendered(substitute(profile, subs));
    expect(rendered.network.allowedDomains).toContain('registry.npmjs.org');
  });
});

describe('build profile — disposable workspace check', () => {
  it('throws WorkspaceNotDisposableError for unmarked tmpdir without overrides', () => {
    const dir = mkdtempSync(join(tmpdir(), 'srt-build-test-'));
    expect(() =>
      assertDisposableWorkspace(dir, { disposableFlag: false, unsafeNonDisposable: false })
    ).toThrow(WorkspaceNotDisposableError);
  });

  it('does not throw after creating .srt-disposable marker', () => {
    const dir = mkdtempSync(join(tmpdir(), 'srt-build-test-'));
    writeFileSync(join(dir, '.srt-disposable'), '');
    expect(() =>
      assertDisposableWorkspace(dir, { disposableFlag: false, unsafeNonDisposable: false })
    ).not.toThrow();
  });
});
