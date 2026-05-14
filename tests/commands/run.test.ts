import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// Shared fake home for all tests in this file. Set before importing any
// modules under test so os.homedir() (mocked below) returns it.
// Use process.env.TMPDIR (or /tmp) rather than os.tmpdir() since the os
// module is mocked below and the mock closes over these constants.
const REAL_TMPDIR = process.env.TMPDIR ?? '/tmp';
const FAKE_HOME = fs.mkdtempSync(path.join(REAL_TMPDIR, 'srt-host-guard-'));
// Separate fake tmpdir so $TMPDIR substitutions in the policy don't end up
// containing FAKE_HOME (which would force spurious allowWrite/denyWrite
// overlap violations unrelated to the behavior under test).
const FAKE_TMPDIR = fs.mkdtempSync(path.join(REAL_TMPDIR, 'srt-host-guard-tmp-'));

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {
    ...actual,
    default: { ...actual, homedir: () => FAKE_HOME, tmpdir: () => FAKE_TMPDIR },
    homedir: () => FAKE_HOME,
    tmpdir: () => FAKE_TMPDIR,
  };
});

const { runCommand } = await import('../../src/commands/run.js');
const { execCommand } = await import('../../src/commands/exec.js');
const { bootstrapCommand } = await import('../../src/commands/bootstrap.js');

describe('host Claude state guard ordering', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(((_code?: number) => undefined as never) as any);
    // Ensure FAKE_HOME exists fresh each test (do not pre-create .claude)
    for (const entry of fs.readdirSync(FAKE_HOME)) {
      fs.rmSync(path.join(FAKE_HOME, entry), { recursive: true, force: true });
    }
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  function makeParsed(subcommand: 'run' | 'exec' | 'bootstrap', stateDir: string) {
    return {
      subcommand,
      profile: 'interactive' as const,
      workspace: FAKE_HOME,
      stateDir,
      unsafeOverrides: new Set<string>() as Set<any>,
      disposable: false,
      unattended: false,
      dryRun: false,
      userArgs: subcommand === 'exec' ? ['echo', 'hi'] : [],
    };
  }

  it('runCommand rejects host ~/.claude state dir without creating it', async () => {
    const hostClaude = path.join(FAKE_HOME, '.claude');
    await expect(runCommand(makeParsed('run', hostClaude))).rejects.toThrow(
      /host-claude-home/,
    );
    expect(fs.existsSync(hostClaude)).toBe(false);
  });

  it('execCommand rejects host ~/.claude state dir without creating it', async () => {
    const hostClaude = path.join(FAKE_HOME, '.claude');
    await expect(execCommand(makeParsed('exec', hostClaude))).rejects.toThrow(
      /host-claude-home/,
    );
    expect(fs.existsSync(hostClaude)).toBe(false);
  });

  it('bootstrapCommand rejects host ~/.claude state dir without creating it', async () => {
    const hostClaude = path.join(FAKE_HOME, '.claude');
    await expect(
      bootstrapCommand(makeParsed('bootstrap', hostClaude)),
    ).rejects.toThrow(/host-claude-home/);
    expect(fs.existsSync(hostClaude)).toBe(false);
  });

  it('runCommand rejects when stateDir is host home (parent of .claude) without creating .claude inside it', async () => {
    await expect(runCommand(makeParsed('run', FAKE_HOME))).rejects.toThrow(
      /host-claude-home/,
    );
    expect(fs.existsSync(path.join(FAKE_HOME, '.claude'))).toBe(false);
  });

  it('runCommand rejects stateDir nested under ~/.ssh without creating any host artifact in ~/.ssh', async () => {
    const sshState = path.join(FAKE_HOME, '.ssh', 'srt-state');
    await expect(runCommand(makeParsed('run', sshState))).rejects.toThrow();
    expect(fs.existsSync(path.join(FAKE_HOME, '.ssh'))).toBe(false);
  });

  it('execCommand rejects stateDir nested under ~/.aws without creating any host artifact in ~/.aws', async () => {
    const awsState = path.join(FAKE_HOME, '.aws', 'srt-state');
    await expect(execCommand(makeParsed('exec', awsState))).rejects.toThrow();
    expect(fs.existsSync(path.join(FAKE_HOME, '.aws'))).toBe(false);
  });

  it('bootstrapCommand rejects stateDir nested under ~/.ssh without creating any host artifact in ~/.ssh', async () => {
    const sshState = path.join(FAKE_HOME, '.ssh', 'srt-state');
    await expect(
      bootstrapCommand(makeParsed('bootstrap', sshState)),
    ).rejects.toThrow();
    expect(fs.existsSync(path.join(FAKE_HOME, '.ssh'))).toBe(false);
  });

  it('runCommand --dry-run does not create the state directory on disk', async () => {
    const state = path.join(FAKE_HOME, 'custom-srt-state');
    const parsed = {
      ...makeParsed('run', state),
      // Use the sibling FAKE_TMPDIR for workspace so its allowWrite entry
      // does not overlap with FAKE_HOME/.{ssh,aws,...} denyWrite entries.
      workspace: FAKE_TMPDIR,
      dryRun: true,
    };
    // Swallow render-mode stdout
    const stdoutSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(((_chunk?: any) => true) as any);
    try {
      await runCommand(parsed);
    } finally {
      stdoutSpy.mockRestore();
    }
    expect(fs.existsSync(state)).toBe(false);
  });
});
