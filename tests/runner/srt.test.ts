import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

vi.mock('node:child_process');

import { runSrt, findSrtBinary } from '../../src/runner/srt.js';
import { buildClaudeArgs } from '../../src/runner/claude-args.js';
import { spawn } from 'node:child_process';

const mockSpawn = vi.mocked(spawn);

describe('findSrtBinary', () => {
  it('throws with install hint when srt is absent from PATH', () => {
    const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'srt-absent-'));
    const origPath = process.env.PATH;
    process.env.PATH = fakeDir;
    try {
      expect(() => findSrtBinary()).toThrow(
        'npm install -g @anthropic-ai/sandbox-runtime',
      );
    } finally {
      process.env.PATH = origPath;
      fs.rmSync(fakeDir, { recursive: true, force: true });
    }
  });
});

describe('runSrt', () => {
  let binDir: string;
  let srtPath: string;
  let origPath: string | undefined;

  beforeEach(() => {
    binDir = fs.mkdtempSync(path.join(os.tmpdir(), 'srt-bin-'));
    srtPath = path.join(binDir, 'srt');
    fs.writeFileSync(srtPath, '#!/bin/sh\n');
    fs.chmodSync(srtPath, 0o755);
    origPath = process.env.PATH;
    process.env.PATH = binDir;
  });

  afterEach(() => {
    process.env.PATH = origPath;
    fs.rmSync(binDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('calls spawn with srt binary path, --settings, settingsPath, and command', async () => {
    const fakeChild = new EventEmitter() as any;
    fakeChild.kill = vi.fn();
    mockSpawn.mockReturnValue(fakeChild);

    const promise = runSrt({
      settingsPath: '/tmp/x/settings.json',
      command: ['claude'],
      env: { FOO: 'bar' },
    });

    fakeChild.emit('close', 0, null);

    await promise;

    expect(mockSpawn).toHaveBeenCalledWith(
      srtPath,
      ['--settings', '/tmp/x/settings.json', 'claude'],
      { stdio: 'inherit', env: expect.objectContaining({ FOO: 'bar' }) },
    );
  });
});

describe('buildClaudeArgs', () => {
  it('prepends --dangerously-skip-permissions for build+unattended', () => {
    expect(
      buildClaudeArgs({ profile: 'build', unattended: true, userArgs: ['-p', 'do-thing'] }),
    ).toEqual(['claude', '--dangerously-skip-permissions', '-p', 'do-thing']);
  });

  it('returns bare claude invocation for interactive+no-unattended', () => {
    expect(
      buildClaudeArgs({ profile: 'interactive', unattended: false, userArgs: [] }),
    ).toEqual(['claude']);
  });
});
