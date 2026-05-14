# Profile: `inspect`

[← Back to README](../../README.md)

The `inspect` profile is for review, verification, and test execution that should not mutate the source tree. The workspace is mounted read-only; writes are confined to well-known output directories.

---

## When to use

Use `inspect` when you want Claude Code to read, analyze, or run tests against a codebase without being able to modify source files. Examples: automated code review, security auditing, test-result reporting, dependency analysis. Not appropriate when Claude needs to write fixes — use [`interactive`](interactive.md) for those.

---

## Filesystem stance

**Allow read:**
- `<workspace>` — full read access to the project directory
- `<claude-state>` — isolated Claude configuration/state
- `~/.cache` — shared read-only access to build/package caches

**Allow write (restricted output paths only):**
- `<workspace>/test-output` — test runner results
- `<workspace>/reports` — analysis/review reports
- `<workspace>/.cache` — workspace-local cache
- `/tmp`, `$TMPDIR` — temporary files
- `~/.cache` — cache writes
- `<claude-state>` — Claude state updates

All other writes inside `<workspace>` are **denied**, *provided the workspace itself is not nested under another allow-write path*. A test runner or tool that writes to a path outside these allowed subpaths will fail with a permission error — this is intentional, not a bug. If your tooling writes elsewhere, either adjust the tool or use the `interactive` profile.

> **Operational caveat — workspace placement under `/tmp` / `$TMPDIR`:**
> The allow-write list above includes `/tmp` and `$TMPDIR`. SRT's path checks are recursive, so if you point `--workspace` at a directory that lives *inside* `/tmp` or `$TMPDIR` (for example, anything created by `mktemp -d -t ...` on macOS, where `$TMPDIR` resolves to a path under `/var/folders/...`), the workspace root and all subpaths under it inherit write access via the temp allowance. The "writes outside `<workspace>/test-output`, `<workspace>/reports`, `<workspace>/.cache` are denied" guarantee only holds when the workspace is rooted outside `/tmp` and `$TMPDIR`. For inspect sessions where the workspace-root deny is load-bearing, use a workspace under your repo or another non-temp parent directory.

---

## Network stance

The inspect profile limits network access to GitHub read-only endpoints:

- `api.github.com` — GitHub REST API (issue/PR fetching for review context)
- `raw.githubusercontent.com` — raw file content
- `codeload.github.com` — archive downloads

No package manager domains are included. Inspect sessions should not install packages.

---

## Known holes

- **A misconfigured test runner that writes outside the allowed subpaths will fail.** This is intentional — the profile is designed to surface these misconfigurations rather than silently allow them.
- **GitHub API access is still an exfiltration channel** for secrets that fit in API request parameters or are reachable via the filesystem, though the surface is much smaller than the full `interactive` domain set.
