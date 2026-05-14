import * as os from 'node:os';
import * as path from 'node:path';
import type { PolicyFragment, UnsafeOverride } from '../profiles/types.js';
import { isInside } from '../util/paths.js';

export class PolicyValidationError extends Error {
  constructor(public readonly violations: string[]) {
    super(`Policy validation failed:\n${violations.map(v => `  - ${v}`).join('\n')}`);
    this.name = 'PolicyValidationError';
  }
}

function isDenied(deny: string[], targetPath: string): boolean {
  return deny.some(p => p === targetPath || isInside(p, targetPath));
}

export function validate(fragment: PolicyFragment, granted: Set<UnsafeOverride>): void {
  const violations: string[] = [];
  const home = os.homedir();
  const denyRead = fragment.filesystem?.denyRead ?? [];
  const denyWrite = fragment.filesystem?.denyWrite ?? [];

  if (fragment.network?.allowLocalBinding === true && !granted.has('local-binding')) {
    violations.push('allowLocalBinding requires the "local-binding" unsafe override');
  }

  if (fragment.network?.allowAllUnixSockets === true && !granted.has('all-unix-sockets')) {
    violations.push('allowAllUnixSockets requires the "all-unix-sockets" unsafe override');
  }

  const sshPath = path.join(home, '.ssh');
  if (!isDenied(denyRead, sshPath)) {
    violations.push(`denyRead must include ${sshPath}`);
  }
  if (!isDenied(denyWrite, sshPath)) {
    violations.push(`denyWrite must include ${sshPath}`);
  }

  const claudePath = path.join(home, '.claude');
  if (!granted.has('host-claude-home')) {
    if (!isDenied(denyRead, claudePath)) {
      violations.push(`denyRead must include ${claudePath} (or grant "host-claude-home")`);
    }
    if (!isDenied(denyWrite, claudePath)) {
      violations.push(`denyWrite must include ${claudePath} (or grant "host-claude-home")`);
    }
  }

  const allowWriteSet = new Set(fragment.filesystem?.allowWrite ?? []);
  for (const p of fragment.filesystem?.denyWrite ?? []) {
    if (allowWriteSet.has(p)) {
      violations.push(`path appears in both allowWrite and denyWrite: ${p}`);
    }
  }

  if (violations.length > 0) {
    throw new PolicyValidationError(violations);
  }
}
