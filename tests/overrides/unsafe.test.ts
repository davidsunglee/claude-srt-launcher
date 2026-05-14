import { describe, it, expect } from 'vitest';
import { parseUnsafeOverrides, applyUnsafeOverrides } from '../../src/overrides/unsafe.js';

describe('parseUnsafeOverrides', () => {
  it('returns empty set for empty string', () => {
    expect(parseUnsafeOverrides('').size).toBe(0);
  });

  it('returns empty set for undefined', () => {
    expect(parseUnsafeOverrides(undefined).size).toBe(0);
  });

  it('returns two-element set for "local-binding,all-unix-sockets"', () => {
    const result = parseUnsafeOverrides('local-binding,all-unix-sockets');
    expect(result.size).toBe(2);
    expect(result.has('local-binding')).toBe(true);
    expect(result.has('all-unix-sockets')).toBe(true);
  });

  it('throws for unknown override with message containing "Allowed:" and "local-binding"', () => {
    expect(() => parseUnsafeOverrides('bogus')).toThrow(/Allowed:/);
    expect(() => parseUnsafeOverrides('bogus')).toThrow(/local-binding/);
  });
});

describe('applyUnsafeOverrides', () => {
  it('sets allowLocalBinding=true for local-binding', () => {
    const fragment = { network: {} };
    const result = applyUnsafeOverrides(fragment, new Set(['local-binding']));
    expect(result.network?.allowLocalBinding).toBe(true);
  });

  it('sets allowAllUnixSockets=true for all-unix-sockets', () => {
    const fragment = { network: {} };
    const result = applyUnsafeOverrides(fragment, new Set(['all-unix-sockets']));
    expect(result.network?.allowAllUnixSockets).toBe(true);
  });

  it('removes ~/.claude from denyRead and denyWrite for host-claude-home', () => {
    const fragment = {
      filesystem: {
        denyRead: ['~/.claude', '~/.ssh'],
        denyWrite: ['~/.claude', '~/.ssh'],
      },
    };
    const result = applyUnsafeOverrides(fragment, new Set(['host-claude-home']));
    expect(result.filesystem?.denyRead?.includes('~/.claude')).toBe(false);
    expect(result.filesystem?.denyWrite?.includes('~/.claude')).toBe(false);
    expect(result.filesystem?.denyRead?.includes('~/.ssh')).toBe(true);
  });

  it('moves ios paths from denyRead to allowRead for ios-codesigning', () => {
    const fragment = {
      filesystem: {
        denyRead: ['~/Library/Keychains', '~/Library/MobileDevice/Provisioning Profiles', '~/.ssh'],
        denyWrite: [],
        allowRead: [],
      },
    };
    const result = applyUnsafeOverrides(fragment, new Set(['ios-codesigning']));
    expect(result.filesystem?.denyRead?.includes('~/Library/Keychains')).toBe(false);
    expect(result.filesystem?.denyRead?.includes('~/Library/MobileDevice/Provisioning Profiles')).toBe(false);
    expect(result.filesystem?.allowRead?.includes('~/Library/Keychains')).toBe(true);
    expect(result.filesystem?.allowRead?.includes('~/Library/MobileDevice/Provisioning Profiles')).toBe(true);
  });

  it('is a no-op for non-disposable-workspace and build-with-egress', () => {
    const fragment = { network: { allowLocalBinding: false } };
    const result = applyUnsafeOverrides(fragment, new Set(['non-disposable-workspace', 'build-with-egress']));
    expect(result.network?.allowLocalBinding).toBe(false);
  });
});
