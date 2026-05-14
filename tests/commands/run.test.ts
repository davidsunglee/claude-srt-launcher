import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// Shared fake home for all tests in this file. Set before importing any
// modules under test so os.homedir() (mocked below) returns it.
const FAKE_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'srt-host-guard-'));

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {
    ...actual,
    default: { ...actual, homedir: () => FAKE_HOME },
    homedir: () => FAKE_HOME,
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
});
