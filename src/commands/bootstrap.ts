import * as os from 'node:os';
import * as path from 'node:path';
import type { PolicyFragment } from '../profiles/types.js';
import { compose } from '../policy/compose.js';
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

const BOOTSTRAP_FRAGMENT: PolicyFragment = {
  filesystem: {
    allowWrite: ['<claude-state>', '~/.npm', '~/.cache', '~/.config/claude'],
  },
};

export async function bootstrapCommand(parsed: ParsedCli): Promise<void> {
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

  const composed = compose([composeProfileFor(parsed), BOOTSTRAP_FRAGMENT]);
  const claudeState = resolveClaudeConfigDir(stateDir, parsed.unsafeOverrides);
  const substituted = substitute(composed, {
    workspace,
    claudeState,
    tmpdir: os.tmpdir(),
    home: os.homedir(),
  });
  validate(substituted, parsed.unsafeOverrides);
  const rendered = toRendered(substituted);

  const settingsPath = await renderToTempfile(rendered);
  const result = await runSrt({
    settingsPath,
    command: ['claude'],
    env: { ...process.env, CLAUDE_CONFIG_DIR: claudeState },
  });
  process.exit(result.exitCode ?? 1);
}
