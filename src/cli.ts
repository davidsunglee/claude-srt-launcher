#!/usr/bin/env node

import { runCommand } from './commands/run.js';
import { execCommand } from './commands/exec.js';
import { bootstrapCommand } from './commands/bootstrap.js';
import { renderCommand } from './commands/render.js';
import { parseUnsafeOverrides } from './overrides/unsafe.js';
import { PolicyValidationError } from './policy/validate.js';
import { WorkspaceNotDisposableError } from './state/workspace.js';
import { DangerousFlagNotAllowedError } from './runner/claude-args.js';
import type { ProfileName } from './profiles/types.js';
import type { ParsedCli } from './commands/compose.js';

const USAGE =
  'usage: claude-srt <run|exec|bootstrap|render> --profile <name> ' +
  '[--workspace <path>] [--state-dir <path>] [--unsafe=<list>] ' +
  '[--disposable] [--unattended] [--dry-run] [-- <inner-args...>]';

const VALID_SUBCOMMANDS = new Set(['run', 'exec', 'bootstrap', 'render']);
const VALID_PROFILES = new Set<ProfileName>(['interactive', 'build', 'inspect', 'ios']);

function usageError(msg: string): never {
  process.stderr.write(`${msg}\n${USAGE}\n`);
  process.exit(2);
  throw new Error('unreachable');
}

function parseArgs(argv: string[]): ParsedCli {
  if (argv.length === 0) usageError('missing subcommand');

  const subcommand = argv[0];
  if (!VALID_SUBCOMMANDS.has(subcommand)) {
    usageError(`unknown subcommand: ${subcommand}`);
  }

  let profile: string | undefined;
  let workspace: string | undefined;
  let stateDir: string | undefined;
  let unsafeRaw: string | undefined;
  let disposable = false;
  let unattended = false;
  let dryRun = false;
  let userArgs: string[] = [];

  let i = 1;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg === '--') {
      userArgs = argv.slice(i + 1);
      break;
    }

    if (arg === '--profile') {
      profile = argv[++i];
    } else if (arg.startsWith('--profile=')) {
      profile = arg.slice('--profile='.length);
    } else if (arg === '--workspace') {
      workspace = argv[++i];
    } else if (arg.startsWith('--workspace=')) {
      workspace = arg.slice('--workspace='.length);
    } else if (arg === '--state-dir') {
      stateDir = argv[++i];
    } else if (arg.startsWith('--state-dir=')) {
      stateDir = arg.slice('--state-dir='.length);
    } else if (arg === '--unsafe') {
      unsafeRaw = argv[++i];
    } else if (arg.startsWith('--unsafe=')) {
      unsafeRaw = arg.slice('--unsafe='.length);
    } else if (arg === '--disposable') {
      disposable = true;
    } else if (arg === '--unattended') {
      unattended = true;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else {
      usageError(`unknown flag: ${arg}`);
    }
    i++;
  }

  if (profile === undefined) {
    usageError('--profile is required');
  }
  if (!VALID_PROFILES.has(profile as ProfileName)) {
    usageError(`unknown profile: ${profile}`);
  }

  let unsafeOverrides;
  try {
    unsafeOverrides = parseUnsafeOverrides(unsafeRaw);
  } catch (err) {
    usageError((err as Error).message);
  }

  if (
    unattended &&
    subcommand === 'run' &&
    profile !== 'build'
  ) {
    process.stderr.write('--unattended is only valid with --profile build\n');
    process.exit(2);
  }

  return {
    subcommand: subcommand as ParsedCli['subcommand'],
    profile: profile as ProfileName,
    workspace,
    stateDir,
    unsafeOverrides,
    disposable,
    unattended,
    dryRun,
    userArgs,
  };
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));

  switch (parsed.subcommand) {
    case 'run':
      await runCommand(parsed);
      break;
    case 'exec':
      await execCommand(parsed);
      break;
    case 'bootstrap':
      await bootstrapCommand(parsed);
      break;
    case 'render':
      await renderCommand(parsed);
      break;
  }
}

main().catch((err) => {
  if (
    err instanceof PolicyValidationError ||
    err instanceof WorkspaceNotDisposableError ||
    err instanceof DangerousFlagNotAllowedError
  ) {
    process.stderr.write(`${err.message}\n`);
    process.exit(2);
  }
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
