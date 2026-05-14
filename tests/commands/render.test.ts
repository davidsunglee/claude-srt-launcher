import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'node:path';
import { renderCommand } from '../../src/commands/render.js';

describe('renderCommand', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let captured: string;

  beforeEach(() => {
    captured = '';
    writeSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(((chunk: any) => {
        captured += typeof chunk === 'string' ? chunk : chunk.toString();
        return true;
      }) as any);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      return undefined as never;
    }) as any);
  });

  afterEach(() => {
    writeSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('prints rendered policy JSON with expected top-level keys', async () => {
    await renderCommand({
      subcommand: 'render',
      profile: 'interactive',
      workspace: '/tmp/test-ws',
      stateDir: '/tmp/test-state',
      unsafeOverrides: new Set(),
      disposable: false,
      unattended: false,
      dryRun: false,
      userArgs: [],
    });

    const parsed = JSON.parse(captured);
    expect(parsed).toHaveProperty('network');
    expect(parsed).toHaveProperty('filesystem');
    expect(parsed).toHaveProperty('enableWeakerNestedSandbox');
    expect(parsed).toHaveProperty('enableWeakerNetworkIsolation');
    expect(parsed.network.allowedDomains).toContain('github.com');
  });

  it('absolutizes a relative --workspace before rendering filesystem paths', async () => {
    await renderCommand({
      subcommand: 'render',
      profile: 'interactive',
      workspace: 'relative-workspace',
      stateDir: '/tmp/test-state',
      unsafeOverrides: new Set(),
      disposable: false,
      unattended: false,
      dryRun: false,
      userArgs: [],
    });

    const parsed = JSON.parse(captured);
    const allFsPaths: string[] = [
      ...parsed.filesystem.denyRead,
      ...parsed.filesystem.allowRead,
      ...parsed.filesystem.allowWrite,
      ...parsed.filesystem.denyWrite,
    ];
    for (const p of allFsPaths) {
      expect(path.isAbsolute(p)).toBe(true);
    }
    const expectedWorkspace = path.resolve(process.cwd(), 'relative-workspace');
    expect(allFsPaths.some(p => p === expectedWorkspace || p.startsWith(expectedWorkspace + path.sep))).toBe(true);
  });

  it('absolutizes a relative --state-dir before rendering filesystem paths', async () => {
    await renderCommand({
      subcommand: 'render',
      profile: 'interactive',
      workspace: '/tmp/test-ws',
      stateDir: 'relative-state',
      unsafeOverrides: new Set(),
      disposable: false,
      unattended: false,
      dryRun: false,
      userArgs: [],
    });

    const parsed = JSON.parse(captured);
    const allFsPaths: string[] = [
      ...parsed.filesystem.denyRead,
      ...parsed.filesystem.allowRead,
      ...parsed.filesystem.allowWrite,
      ...parsed.filesystem.denyWrite,
    ];
    for (const p of allFsPaths) {
      expect(path.isAbsolute(p)).toBe(true);
    }
    const expectedClaudeState = path.resolve(process.cwd(), 'relative-state', '.claude');
    expect(allFsPaths.some(p => p === expectedClaudeState || p.startsWith(expectedClaudeState + path.sep))).toBe(true);
  });
});
