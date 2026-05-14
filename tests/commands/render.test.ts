import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
});
