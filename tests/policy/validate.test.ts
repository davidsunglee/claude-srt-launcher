import { describe, it, expect } from 'vitest';
import { validate, PolicyValidationError } from '../../src/policy/validate.js';
import type { PolicyFragment } from '../../src/profiles/types.js';
import * as os from 'node:os';
import * as path from 'node:path';

describe('validate', () => {
  const home = os.homedir();
  const baseDenyRead = [
    path.join(home, '.ssh'),
    path.join(home, '.claude'),
  ];

  it('throws when allowLocalBinding is true without local-binding grant', () => {
    const fragment: PolicyFragment = {
      network: { allowLocalBinding: true },
      filesystem: { denyRead: baseDenyRead, denyWrite: baseDenyRead },
    };
    let caught: unknown;
    try {
      validate(fragment, new Set());
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(PolicyValidationError);
    expect((caught as PolicyValidationError).violations.some(v => v.includes('allowLocalBinding'))).toBe(true);
  });

  it('does not throw when allowLocalBinding is true with local-binding grant', () => {
    const fragment: PolicyFragment = {
      network: { allowLocalBinding: true },
      filesystem: { denyRead: baseDenyRead, denyWrite: baseDenyRead },
    };
    expect(() => validate(fragment, new Set(['local-binding']))).not.toThrow();
  });

  it('throws when denyRead is missing the ~/.ssh path', () => {
    const fragment: PolicyFragment = {
      filesystem: { denyRead: [] },
    };
    let caught: unknown;
    try {
      validate(fragment, new Set(['host-claude-home']));
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(PolicyValidationError);
    expect((caught as PolicyValidationError).violations.some(v => v.toLowerCase().includes('ssh'))).toBe(true);
  });

  it('throws when denyWrite is missing the ~/.ssh path', () => {
    const fragment: PolicyFragment = {
      filesystem: {
        denyRead: baseDenyRead,
        denyWrite: [path.join(home, '.claude')],
      },
    };
    let caught: unknown;
    try {
      validate(fragment, new Set());
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(PolicyValidationError);
    const violations = (caught as PolicyValidationError).violations;
    expect(violations.some(v => v.toLowerCase().includes('denywrite') && v.toLowerCase().includes('ssh'))).toBe(true);
  });

  it('throws when denyWrite is missing the ~/.claude path and host-claude-home is not granted', () => {
    const fragment: PolicyFragment = {
      filesystem: {
        denyRead: baseDenyRead,
        denyWrite: [path.join(home, '.ssh')],
      },
    };
    let caught: unknown;
    try {
      validate(fragment, new Set());
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(PolicyValidationError);
    const violations = (caught as PolicyValidationError).violations;
    expect(violations.some(v => v.toLowerCase().includes('denywrite') && v.includes('.claude'))).toBe(true);
  });

  it('does not throw when denyWrite is missing the ~/.claude path but host-claude-home is granted', () => {
    const fragment: PolicyFragment = {
      filesystem: {
        denyRead: [path.join(home, '.ssh')],
        denyWrite: [path.join(home, '.ssh')],
      },
    };
    expect(() => validate(fragment, new Set(['host-claude-home']))).not.toThrow();
  });

  it('does not throw when denyRead and denyWrite both include the required paths', () => {
    const fragment: PolicyFragment = {
      filesystem: {
        denyRead: baseDenyRead,
        denyWrite: baseDenyRead,
      },
    };
    expect(() => validate(fragment, new Set())).not.toThrow();
  });

  it('throws when allowWrite contains a path nested under a credential denyWrite root', () => {
    const fragment: PolicyFragment = {
      filesystem: {
        denyRead: baseDenyRead,
        denyWrite: baseDenyRead,
        allowWrite: [path.join(home, '.ssh', 'srt', '.claude')],
      },
    };
    let caught: unknown;
    try {
      validate(fragment, new Set());
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(PolicyValidationError);
    const violations = (caught as PolicyValidationError).violations;
    expect(
      violations.some(v => v.toLowerCase().includes('allowwrite') && v.includes('.ssh')),
    ).toBe(true);
  });

  it('throws when allowWrite contains a path nested under ~/.claude denyWrite root', () => {
    const fragment: PolicyFragment = {
      filesystem: {
        denyRead: baseDenyRead,
        denyWrite: baseDenyRead,
        allowWrite: [path.join(home, '.claude', 'nested', 'state')],
      },
    };
    let caught: unknown;
    try {
      validate(fragment, new Set());
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(PolicyValidationError);
    const violations = (caught as PolicyValidationError).violations;
    expect(
      violations.some(v => v.toLowerCase().includes('allowwrite') && v.includes('.claude')),
    ).toBe(true);
  });

  it('rejects an inspect-shaped policy whose workspace is nested under a tmp allowWrite root', () => {
    // Models inspect's allowWrite (which excludes <workspace>) plus a workspace
    // rooted under /tmp. The recursive allowWrite over /tmp silently re-permits
    // workspace-root writes, which the inspect profile is supposed to deny.
    const fragment: PolicyFragment = {
      filesystem: {
        denyRead: baseDenyRead,
        denyWrite: baseDenyRead,
        allowRead: ['/tmp/my-inspect-ws'],
        allowWrite: [
          '/tmp/my-inspect-ws/test-output',
          '/tmp/my-inspect-ws/reports',
          '/tmp/my-inspect-ws/.cache',
          '/tmp',
        ],
      },
    };
    let caught: unknown;
    try {
      validate(fragment, new Set(), { workspace: '/tmp/my-inspect-ws' });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(PolicyValidationError);
    const violations = (caught as PolicyValidationError).violations;
    expect(
      violations.some(v =>
        v.toLowerCase().includes('workspace') &&
        v.includes('/tmp'),
      ),
    ).toBe(true);
  });

  it('does not reject when workspace is not nested under any non-workspace allowWrite root', () => {
    const fragment: PolicyFragment = {
      filesystem: {
        denyRead: baseDenyRead,
        denyWrite: baseDenyRead,
        allowRead: ['/home/u/repo'],
        allowWrite: [
          '/home/u/repo/test-output',
          '/home/u/repo/reports',
          '/home/u/repo/.cache',
          '/tmp',
        ],
      },
    };
    expect(() =>
      validate(fragment, new Set(), { workspace: '/home/u/repo' }),
    ).not.toThrow();
  });

  it('does not reject when workspace itself is an allowWrite entry (non-inspect profile shape)', () => {
    // For profiles like interactive/build/ios, <workspace> is in allowWrite by
    // design — workspace-root writes are intentionally permitted, so nesting
    // under /tmp must not be rejected.
    const fragment: PolicyFragment = {
      filesystem: {
        denyRead: baseDenyRead,
        denyWrite: baseDenyRead,
        allowRead: ['/tmp/ws'],
        allowWrite: ['/tmp/ws', '/tmp'],
      },
    };
    expect(() =>
      validate(fragment, new Set(), { workspace: '/tmp/ws' }),
    ).not.toThrow();
  });

  it('throws when a denyWrite path is nested inside an allowWrite root', () => {
    const fragment: PolicyFragment = {
      filesystem: {
        denyRead: baseDenyRead,
        denyWrite: [...baseDenyRead, path.join(home, 'project', '.ssh')],
        allowWrite: [path.join(home, 'project')],
      },
    };
    let caught: unknown;
    try {
      validate(fragment, new Set());
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(PolicyValidationError);
  });
});
