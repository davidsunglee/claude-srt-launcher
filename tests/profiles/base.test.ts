import { describe, it, expect } from 'vitest';
import { BASE_POLICY } from '../../src/profiles/base.js';

describe('BASE_POLICY', () => {
  it('disables local binding', () => {
    expect(BASE_POLICY.network?.allowLocalBinding).toBe(false);
  });

  it('disables all unix sockets', () => {
    expect(BASE_POLICY.network?.allowAllUnixSockets).toBe(false);
  });

  it('denies ~/.ssh', () => {
    expect(BASE_POLICY.filesystem?.denyRead?.includes('~/.ssh')).toBe(true);
  });

  it('denies ~/.claude (host)', () => {
    expect(BASE_POLICY.filesystem?.denyRead?.includes('~/.claude')).toBe(true);
  });

  it('allows api.anthropic.com', () => {
    expect(BASE_POLICY.network?.allowedDomains?.includes('api.anthropic.com')).toBe(true);
  });

  it('allows platform.claude.com for Claude Code service connections', () => {
    expect(BASE_POLICY.network?.allowedDomains?.includes('platform.claude.com')).toBe(true);
  });
});
