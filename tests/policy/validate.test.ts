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
