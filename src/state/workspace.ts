import * as fs from 'fs';
import * as path from 'path';

export class WorkspaceNotDisposableError extends Error {
  constructor(
    public workspacePath: string,
    public markerFilename: string = '.srt-disposable'
  ) {
    super(
      `Workspace at ${workspacePath} is not disposable (marker file ${markerFilename} not found)`
    );
    this.name = 'WorkspaceNotDisposableError';
  }
}

export function resolveWorkspace(cwd: string, override?: string): string {
  const targetPath = override ?? cwd;
  const absolutePath = path.resolve(targetPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Path does not exist: ${absolutePath}`);
  }

  return absolutePath;
}

export interface DisposableWorkspaceOptions {
  disposableFlag: boolean;
  unsafeNonDisposable: boolean;
}

export function assertDisposableWorkspace(
  workspacePath: string,
  opts: DisposableWorkspaceOptions
): void {
  if (opts.unsafeNonDisposable) {
    console.warn('Using unsafe non-disposable workspace override');
    return;
  }

  if (opts.disposableFlag) {
    return;
  }

  const markerPath = path.join(workspacePath, '.srt-disposable');
  if (fs.existsSync(markerPath)) {
    return;
  }

  throw new WorkspaceNotDisposableError(workspacePath);
}
