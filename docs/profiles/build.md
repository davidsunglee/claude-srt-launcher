# Profile: `build`

[← Back to README](../../README.md)

The `build` profile is designed for unattended workflows (CI/CD, batch jobs) in disposable workspaces where you want minimal network egress and a guardrail against accidentally writing to persistent state.

---

## When to use

Use `build` for automated pipelines that run Claude Code without human supervision. Examples: CI step that generates code, batch refactoring jobs, automated test generation. Not appropriate for interactive sessions — use [`interactive`](interactive.md) for those.

---

## Disposable workspace requirement

The build profile requires the workspace to be marked as disposable before it will run. It checks for any of the following, in order:

1. A `.srt-disposable` marker file at the root of `<workspace>`
2. The `--disposable` flag on the command line
3. `--unsafe=non-disposable-workspace` to explicitly bypass the check

This is a **workflow guardrail, not a security control.** The `.srt-disposable` marker is filesystem-based and trivially fakeable. Its purpose is to prevent accidental runs against a developer's primary working copy or production checkout.

---

## Default filesystem stance

**Allow read:**
- `<workspace>` — your project directory
- `<claude-state>` — isolated Claude configuration/state
- `~/.npm`, `~/Library/pnpm`, `~/Library/Caches/pnpm`, `~/.cache` — package manager caches (read only)

**Allow write:**
- `<workspace>` — your project directory
- `<claude-state>` — isolated Claude configuration/state
- `/tmp`, `$TMPDIR` — temporary files

Note that pnpm's macOS store/cache paths are read-only in this profile: builds should hydrate them in advance (e.g. via a pre-build step that ran under `interactive`) and consume them during the build without further writes.

---

## Default network stance

The build profile restricts network egress to the Claude service only. No GitHub, no npm, no PyPI — only the requests Claude Code itself makes to the Anthropic API.

This is intentional: unattended builds should be hermetic. Pull all dependencies before launching the sandbox, not from within it.

---

## How to add network egress

Pass `--unsafe=build-with-egress` to add the same GitHub + package-manager domain set used by the `interactive` profile. This is appropriate when the build step itself needs to install packages, but be aware that **those domains are exfiltration channels** — any secret or file reachable inside the sandbox can be sent to `github.com` or `registry.npmjs.org`.

---

## How `--dangerously-skip-permissions` is gated

`--dangerously-skip-permissions` is only passed through to Claude Code when **all three** of the following are true:

1. `--unattended` is supplied on the command line
2. The profile is `build`
3. The disposable workspace check passes (marker file present, `--disposable` flag set, or `--unsafe=non-disposable-workspace` granted)

In all other cases, permission prompts remain active. This prevents `--dangerously-skip-permissions` from being silently inherited by interactive or inspect profiles.

---

## Known holes

- **The `.srt-disposable` marker is trivially fakeable.** Anyone with write access to `<workspace>` can create the file. Treat the disposable check as a workflow guardrail that prevents accidents, not as a security boundary that prevents malice.
- **Network-hermetic builds still reach the Anthropic API.** The Claude service endpoint is always reachable. Code or prompt injection that causes Claude to exfiltrate data via the API response stream is not blocked by this profile.
