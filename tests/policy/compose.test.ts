import { describe, it, expect } from 'vitest';
import { compose } from '../../src/policy/compose.js';
import type { PolicyFragment } from '../../src/profiles/types.js';

describe('compose', () => {
  it('deduplicates array fields preserving first-occurrence order', () => {
    const a: PolicyFragment = { network: { allowedDomains: ['a', 'b'] } };
    const b: PolicyFragment = { network: { allowedDomains: ['b', 'c'] } };
    const result = compose([a, b]);
    expect(result.network?.allowedDomains).toEqual(['a', 'b', 'c']);
  });

  it('later undefined does not overwrite earlier boolean', () => {
    const a: PolicyFragment = { network: { allowLocalBinding: true } };
    const b: PolicyFragment = { network: {} };
    const result = compose([a, b]);
    expect(result.network?.allowLocalBinding).toBe(true);
  });

  it('later defined boolean wins', () => {
    const a: PolicyFragment = {};
    const b: PolicyFragment = { network: { allowLocalBinding: true } };
    const result = compose([a, b]);
    expect(result.network?.allowLocalBinding).toBe(true);
  });

  it('later false overwrites earlier true because false is defined', () => {
    const a: PolicyFragment = { network: { allowLocalBinding: true } };
    const b: PolicyFragment = { network: { allowLocalBinding: false } };
    const result = compose([a, b]);
    expect(result.network?.allowLocalBinding).toBe(false);
  });

  it('composes top-level allowPty with the same later-defined boolean semantics', () => {
    const a: PolicyFragment = { allowPty: true };
    const b: PolicyFragment = {};
    const c: PolicyFragment = { allowPty: false };

    expect(compose([a, b]).allowPty).toBe(true);
    expect(compose([a, c]).allowPty).toBe(false);
  });
});
