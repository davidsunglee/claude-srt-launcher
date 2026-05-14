import * as path from 'node:path';

export function expandTilde(p: string, home: string): string {
  if (p === '~' || p.startsWith('~/')) {
    return home + p.slice(1);
  }
  return p;
}

export function expandTmpdir(p: string, tmpdir: string): string {
  return p.replace(/\$\{TMPDIR\}|\$TMPDIR/g, tmpdir);
}

export function isInside(parent: string, child: string): boolean {
  const resolvedParent = path.resolve(parent);
  const resolvedChild = path.resolve(child);
  return resolvedChild === resolvedParent || resolvedChild.startsWith(resolvedParent + path.sep);
}
