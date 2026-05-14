import * as os from 'node:os';
import * as path from 'node:path';
import { substitute } from '../policy/substitute.js';
import { validate } from '../policy/validate.js';
import { toRendered, renderToTempfile } from '../policy/render.js';
import {
  resolveClaudeStateDir,
  ensureClaudeStateDir,
  resolveClaudeConfigDir,
  assertNotHostClaudeHome,
} from '../state/claude-home.js';
import { resolveWorkspace, assertDisposableWorkspace } from '../state/workspace.js';
import { runSrt } from '../runner/srt.js';
import { buildClaudeArgs } from '../runner/claude-args.js';
import { composeProfileFor, type ParsedCli } from './compose.js';
import { renderCommand } from './render.js';

export async function runCommand(parsed: ParsedCli): Promise<void> {
  const workspace = resolveWorkspace(process.cwd(), parsed.workspace);

  if (parsed.profile === 'build') {
    assertDisposableWorkspace(workspace, {
      disposableFlag: parsed.disposable,
      unsafeNonDisposable: parsed.unsafeOverrides.has('non-disposable-workspace'),
    });
  }

  const stateDir = path.resolve(parsed.stateDir ?? resolveClaudeStateDir(parsed.profile));
  assertNotHostClaudeHome(stateDir, parsed.unsafeOverrides as Set<string>);
  await ensureClaudeStateDir(stateDir);

  const composed = composeProfileFor(parsed);
  const claudeState = resolveClaudeConfigDir(stateDir, parsed.unsafeOverrides);
  const substituted = substitute(composed, {
    workspace,
    claudeState,
    tmpdir: os.tmpdir(),
    home: os.homedir(),
  });
  validate(substituted, parsed.unsafeOverrides);
  const rendered = toRendered(substituted);

  if (parsed.dryRun) {
    await renderCommand(parsed);
    return;
  }

  const settingsPath = await renderToTempfile(rendered);
  const result = await runSrt({
    settingsPath,
    command: buildClaudeArgs({
      profile: parsed.profile,
      unattended: parsed.unattended,
      userArgs: parsed.userArgs,
    }),
    env: { ...process.env, CLAUDE_CONFIG_DIR: claudeState },
  });
  process.exit(result.exitCode ?? 1);
}
