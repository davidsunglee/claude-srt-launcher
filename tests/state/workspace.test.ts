import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  WorkspaceNotDisposableError,
  resolveWorkspace,
  assertDisposableWorkspace,
} from '../../src/state/workspace';

describe('workspace', () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  describe('resolveWorkspace', () => {
    it('resolves cwd to absolute path when no override provided', () => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-test-'));
      const resolved = resolveWorkspace(tmpDir);
      expect(resolved).toBe(path.resolve(tmpDir));
    });

    it('uses override when provided', () => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-test-'));
      const override = tmpDir;
      const resolved = resolveWorkspace('/some/path', override);
      expect(resolved).toBe(path.resolve(override));
    });

    it('throws if path does not exist', () => {
      const nonExistent = '/this/path/does/not/exist';
      expect(() => resolveWorkspace(nonExistent)).toThrow();
    });
  });

  describe('assertDisposableWorkspace', () => {
    it('rejects without marker or flag', () => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-test-'));
      expect(() =>
        assertDisposableWorkspace(tmpDir, {
          disposableFlag: false,
          unsafeNonDisposable: false,
        })
      ).toThrow(WorkspaceNotDisposableError);
    });

    it('passes with disposableFlag: true', () => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-test-'));
      expect(() =>
        assertDisposableWorkspace(tmpDir, {
          disposableFlag: true,
          unsafeNonDisposable: false,
        })
      ).not.toThrow();
    });

    it('passes with .srt-disposable marker file', () => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-test-'));
      fs.writeFileSync(path.join(tmpDir, '.srt-disposable'), '');
      expect(() =>
        assertDisposableWorkspace(tmpDir, {
          disposableFlag: false,
          unsafeNonDisposable: false,
        })
      ).not.toThrow();
    });

    it('passes with unsafeNonDisposable: true and emits warning', () => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-test-'));
      const warnSpy = vi.spyOn(console, 'warn');
      expect(() =>
        assertDisposableWorkspace(tmpDir, {
          disposableFlag: false,
          unsafeNonDisposable: true,
        })
      ).not.toThrow();
      expect(warnSpy).toHaveBeenCalled();
      expect(warnSpy.mock.calls[0][0]).toContain('unsafe');
      warnSpy.mockRestore();
    });
  });
});
