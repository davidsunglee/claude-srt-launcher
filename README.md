# claude-srt-launcher

A standalone TypeScript/Node CLI that launches Claude Code under the [Anthropic Sandbox Runtime](https://github.com/anthropics/sandbox-runtime) (SRT) using four named, code-validated policy profiles. SRT enforces a baseline OS sandbox boundary on macOS — it is **not** VM-grade isolation. For hostile-code workloads where kernel-level or syscall-level attacks are a concern, use a full VM boundary such as Tart or Gondolin instead.

> **Independence note:** This tool is independent of Gondolin, Pi, and pi-interactive-subagent. It does not depend on, wrap, or integrate with any of those systems.

---

## Install

```sh
npm install -g @anthropic-ai/sandbox-runtime   # provides the `srt` binary
git clone https://github.com/your-org/claude-srt-launcher
cd claude-srt-launcher
npm install
npm run build
```

---

## Quick start

```sh
just interactive
# or directly:
node dist/cli.js run --profile interactive
```

---

## Profile matrix

| Profile | Use case | Default network egress | Workspace writes | Isolated Claude state | `--dangerously-skip-permissions` | Notable unsafe overrides |
|---|---|---|---|---|---|---|
| `interactive` | Day-to-day development with full package-manager access | GitHub + npm/PyPI/Cargo/Go/RubyGems/Maven/Docker domains | Yes | Yes (isolated `<claude-state>`) | Allowed | `host-claude-home`, `local-binding`, `all-unix-sockets` |
| `build` | Unattended CI/CD in disposable workspaces | Claude service only (no GitHub/npm) | Yes | Yes (isolated `<claude-state>`) | Only with `--unattended` + disposable workspace | `build-with-egress`, `non-disposable-workspace` |
| `inspect` | Code review, verification, read-only test execution | `api.github.com`, `raw.githubusercontent.com`, `codeload.github.com` only | No (test-output/reports/.cache only) | Yes (isolated `<claude-state>`) | Not recommended | None |
| `ios` | iOS Simulator build/test workflows | Interactive domains + Apple developer CDN + Swift package registry | Yes (DerivedData, caches) | Yes (isolated `<claude-state>`) | Allowed | `ios-codesigning` |

### Per-profile documentation

- [interactive](docs/profiles/interactive.md) — day-to-day development
- [build](docs/profiles/build.md) — unattended CI/CD
- [inspect](docs/profiles/inspect.md) — read-only review and verification
- [ios](docs/profiles/ios.md) — iOS Simulator workflows

---

## Bootstrap mode

Run `just bootstrap interactive` (replacing `interactive` with your chosen profile) to launch an interactive session where you can install plugins, MCP servers, and agents into the isolated Claude state directory before running production workloads. This lets you pre-populate the sandboxed `<claude-state>` without touching your host `~/.claude`.

---

## Smoke test

Run `npm run smoke` (or `just smoke`) to execute the smoke-test suite:

- **Profile rendering** — renders all four profiles and asserts the output is valid JSON with the expected top-level keys.
- **Override parsing** — asserts that unknown override names are rejected and known names are accepted.
- **Disposable check** — asserts that the build profile refuses to launch without `.srt-disposable` or `--disposable` unless `--unsafe=non-disposable-workspace` is passed.
- **Network baseline** — asserts the inspect profile does not include npm or PyPI domains.

---

## Unsafe overrides

Pass `--unsafe=<name>[,<name>...]` to opt into behaviors that weaken the sandbox. Every override must be explicitly named; there is no wildcard.

| Override | What it does | What it weakens |
|---|---|---|
| `host-claude-home` | Removes `~/.claude` from `denyRead`/`denyWrite` so the sandboxed Claude shares your host `~/.claude` directory | Host Claude configuration, conversation history, and secrets stored in `~/.claude` are accessible to code running inside the sandbox. An exfiltration channel via allowed network domains. |
| `local-binding` | Sets `allowLocalBinding: true`, allowing processes inside the sandbox to bind to localhost ports | A process binding to a local port can receive connections from the host or other sandbox processes; this is an intra-host lateral-movement risk and weakens network isolation. macOS' current `allowLocalBinding` behavior means local binding is not strongly isolated. |
| `all-unix-sockets` | Sets `allowAllUnixSockets: true`, removing the per-socket allowlist | Any Unix socket on the host becomes accessible, including Docker, OrbStack, and other daemon sockets. Connecting to the Docker or OrbStack socket is effectively host-level container execution — treat it as host access. |
| `non-disposable-workspace` | Bypasses the disposable-workspace requirement in the build profile | The build profile is designed for disposable workspaces to limit blast radius. Removing this check means Claude Code can make persistent writes to a production or developer workspace. This is a workflow guardrail bypass, not a security no-op. |
| `build-with-egress` | Adds the full GitHub + package-manager domain set to the build profile's network policy | GitHub and package-manager domains are exfiltration channels. Any secret or file reachable by the sandbox process can be sent to `github.com` or `registry.npmjs.org` etc. |
| `ios-codesigning` | Removes `~/Library/Keychains` and `~/Library/MobileDevice/Provisioning Profiles` from `denyRead` and adds them to `allowRead` | Grants the sandbox read access to host signing credentials and provisioning profiles. Required for archive/export workflows but exposes host code-signing material to any code running in the sandbox. |

---

## Known holes / when to escalate to a VM

SRT provides an OS sandbox boundary, but it does **not** protect against:

- **Kernel-level privilege escalation** — a vulnerability in the macOS kernel or a privileged system service can break out of the sandbox boundary entirely.
- **Syscall-level vulnerabilities** — SRT does not intercept or filter syscalls at a VM hypervisor level.
- **Local binding exposure** — macOS' current `allowLocalBinding` behavior means processes that bind to localhost ports may be reachable from the host; this is not strongly isolated.
- **GitHub / package-manager domains as exfiltration channels** — allowing `github.com`, `registry.npmjs.org`, or similar domains means any secret or file accessible to the sandboxed process can be exfiltrated to those endpoints. This applies to both the `interactive` profile and `--unsafe=build-with-egress`.
- **Docker / OrbStack socket access** — using `--unsafe=all-unix-sockets` exposes Docker and OrbStack sockets. Connecting to those sockets is effectively host-level container execution and should be treated as host access.
- **Host Claude state exposure** — `--unsafe=host-claude-home` exposes the host `~/.claude` directory, including conversation history and any secrets stored there.

**When to use a VM instead:** For workloads that execute untrusted or hostile code, use [Tart](https://tart.run/), Gondolin, or another full VM boundary. SRT is appropriate for trusted-developer workflows where the main goal is containing accidental writes and limiting network egress.
