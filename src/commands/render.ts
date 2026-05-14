import * as os from 'node:os';
import * as path from 'node:path';
import { substitute } from '../policy/substitute.js';
import { validate } from '../policy/validate.js';
import { toRendered } from '../policy/render.js';
import { resolveClaudeStateDir, claudeConfigDirFor } from '../state/claude-home.js';
import { composeProfileFor, type ParsedCli } from './compose.js';

export async function renderCommand(parsed: ParsedCli): Promise<void> {
  const workspace = path.resolve(parsed.workspace ?? process.cwd());
  const stateDir = path.resolve(parsed.stateDir ?? resolveClaudeStateDir(parsed.profile));
  const claudeState = claudeConfigDirFor(stateDir);

  const composed = composeProfileFor(parsed);
  const substituted = substitute(composed, {
    workspace,
    claudeState,
    tmpdir: os.tmpdir(),
    home: os.homedir(),
  });
  validate(substituted, parsed.unsafeOverrides);
  const rendered = toRendered(substituted);

  process.stdout.write(JSON.stringify(rendered, null, 2) + '\n');
  process.exit(0);
}
