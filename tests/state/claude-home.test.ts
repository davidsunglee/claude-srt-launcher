import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  resolveClaudeStateDir,
  ensureClaudeStateDir,
  claudeConfigDirFor,
  assertNotHostClaudeHome
} from '../../src/state/claude-home.js';

describe('claude-home', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `claude-test-${Date.now()}-${Math.random()}`);
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('resolveClaudeStateDir', () => {
    it('returns profile subdirectory under default state root', () => {
      const result = resolveClaudeStateDir('interactive');
      const expectedRoot = path.join(os.homedir(), '.claude-srt-launcher', 'state');
      const expected = path.join(expectedRoot, 'interactive');
      expect(result).toBe(expected);
    });

    it('returns profile subdirectory under custom state root', () => {
      const result = resolveClaudeStateDir('interactive', { stateRoot: tmpDir });
      const expected = path.join(tmpDir, 'interactive');
      expect(result).toBe(expected);
    });

    it('supports different profile names', () => {
      const result = resolveClaudeStateDir('prod', { stateRoot: tmpDir });
      const expected = path.join(tmpDir, 'prod');
      expect(result).toBe(expected);
    });
  });

  describe('ensureClaudeStateDir', () => {
    it('creates state directory with mode 0700', async () => {
      const stateDir = path.join(tmpDir, 'state');
      await ensureClaudeStateDir(stateDir);

      const stats = await fs.stat(stateDir);
      expect(stats.isDirectory()).toBe(true);
      const mode = stats.mode & 0o777;
      expect(mode).toBe(0o700);
    });

    it('creates .claude subdirectory with mode 0700', async () => {
      const stateDir = path.join(tmpDir, 'state');
      await ensureClaudeStateDir(stateDir);

      const claudeDir = path.join(stateDir, '.claude');
      const stats = await fs.stat(claudeDir);
      expect(stats.isDirectory()).toBe(true);
      const mode = stats.mode & 0o777;
      expect(mode).toBe(0o700);
    });

    it('is idempotent - can be called multiple times', async () => {
      const stateDir = path.join(tmpDir, 'state');
      await ensureClaudeStateDir(stateDir);
      // Should not throw on second call
      await ensureClaudeStateDir(stateDir);

      const stats = await fs.stat(stateDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('tightens an existing permissive state directory to mode 0700', async () => {
      const stateDir = path.join(tmpDir, 'pre-existing-state');
      const claudeDir = path.join(stateDir, '.claude');
      await fs.mkdir(stateDir, { recursive: true });
      await fs.mkdir(claudeDir, { recursive: true });
      await fs.chmod(stateDir, 0o755);
      await fs.chmod(claudeDir, 0o755);

      await ensureClaudeStateDir(stateDir);

      expect((await fs.stat(stateDir)).mode & 0o777).toBe(0o700);
      expect((await fs.stat(claudeDir)).mode & 0o777).toBe(0o700);
    });
  });

  describe('claudeConfigDirFor', () => {
    it('returns .claude subdirectory path', () => {
      const stateDir = '/some/path';
      const result = claudeConfigDirFor(stateDir);
      expect(result).toBe(path.join(stateDir, '.claude'));
    });
  });

  describe('assertNotHostClaudeHome', () => {
    it('throws when stateDir points to host ~/.claude without grant', () => {
      const hostClaudeHome = path.join(os.homedir(), '.claude');
      expect(() => {
        assertNotHostClaudeHome(hostClaudeHome, new Set());
      }).toThrow();
    });

    it('does not throw when stateDir points to host ~/.claude with host-claude-home grant', () => {
      const hostClaudeHome = path.join(os.homedir(), '.claude');
      const granted = new Set(['host-claude-home']);
      expect(() => {
        assertNotHostClaudeHome(hostClaudeHome, granted);
      }).not.toThrow();
    });

    it('throws when stateDir is parent of host ~/.claude without grant', () => {
      const hostClaudeHome = path.join(os.homedir(), '.claude');
      const parentDir = path.dirname(hostClaudeHome);
      expect(() => {
        assertNotHostClaudeHome(parentDir, new Set());
      }).toThrow();
    });

    it('allows safe state directories without grant', () => {
      const safeDir = path.join(tmpDir, 'safe-state');
      expect(() => {
        assertNotHostClaudeHome(safeDir, new Set());
      }).not.toThrow();
    });
  });
});
