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
import { composeProfileFor, type ParsedCli } from './compose.js';

export async function execCommand(parsed: ParsedCli): Promise<void> {
  const workspace = resolveWorkspace(process.cwd(), parsed.workspace);

  if (parsed.profile === 'build') {
    assertDisposableWorkspace(workspace, {
      disposableFlag: parsed.disposable,
      unsafeNonDisposable: parsed.unsafeOverrides.has('non-disposable-workspace'),
    });
  }

  const stateDir = path.resolve(parsed.stateDir ?? resolveClaudeStateDir(parsed.profile));
  await ensureClaudeStateDir(stateDir);
  assertNotHostClaudeHome(stateDir, parsed.unsafeOverrides as Set<string>);

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

  if (parsed.userArgs.length === 0) {
    process.stderr.write('exec requires a command after `--`\n');
    process.exit(2);
  }

  const settingsPath = await renderToTempfile(rendered);
  const result = await runSrt({
    settingsPath,
    command: parsed.userArgs,
    env: { ...process.env, CLAUDE_CONFIG_DIR: claudeState },
  });
  process.exit(result.exitCode ?? 1);
}
