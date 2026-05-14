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
      filesystem: { denyRead: baseDenyRead },
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
      filesystem: { denyRead: baseDenyRead },
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
});
