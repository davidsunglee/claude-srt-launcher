# Profile: `interactive`

[← Back to README](../../README.md)

The `interactive` profile is the default profile for day-to-day development. It gives Claude Code full read/write access to your workspace and a curated set of package-manager domains for installing dependencies.

---

## When to use

Use `interactive` for active development sessions where you need Claude Code to fetch packages, read and write project files, and access common developer caches. This is not appropriate for unattended or CI/CD workloads — use [`build`](build.md) for those.

---

## Default network stance

Claude service access is always included. In addition, `interactive` allows the following domains:

**GitHub:**
- `github.com`, `*.github.com`, `api.github.com`, `raw.githubusercontent.com`, `objects.githubusercontent.com`, `codeload.github.com`, `lfs.github.com`

**npm / Yarn:**
- `registry.npmjs.org`, `registry.yarnpkg.com`

**PyPI:**
- `pypi.org`, `files.pythonhosted.org`

**Cargo / Rust:**
- `crates.io`, `static.crates.io`

**Go:**
- `proxy.golang.org`, `sum.golang.org`

**RubyGems:**
- `rubygems.org`

**Maven:**
- `repo.maven.apache.org`, `repo1.maven.org`

**Docker Hub:**
- `auth.docker.io`, `registry-1.docker.io`, `index.docker.io`, `production.cloudflare.docker.com`

---

## Default filesystem stance

**Allow read + write:**
- `<workspace>` — your project directory
- `<claude-state>` — isolated Claude configuration/state (not your host `~/.claude`)
- `~/.npm`, `~/Library/pnpm`, `~/Library/Caches/pnpm`, `~/.yarn`, `~/.cache`, `~/.cargo` — package manager caches

**Allow read only:**
- `~/.rustup`, `~/.rbenv`, `~/.pyenv`, `~/go` — language toolchain directories

**Allow write only:**
- `/tmp`, `$TMPDIR` — temporary files

**Denied (implicit):**
- `~/.ssh` — SSH keys
- `~/.aws` — AWS credentials
- `~/.gnupg` — GPG keys
- `~/.claude` — host Claude configuration (the sandbox uses an isolated state instead)
- Browser profile directories
- System keychains

---

## Unsafe overrides accepted

| Override | Effect |
|---|---|
| `host-claude-home` | Removes `~/.claude` from the deny list so the sandbox shares your host Claude state |
| `local-binding` | Allows processes inside the sandbox to bind to localhost ports |
| `all-unix-sockets` | Allows access to all Unix sockets, including Docker and OrbStack |

See the [README unsafe overrides section](../../README.md#unsafe-overrides) for full descriptions and warnings.

---

## Known holes

- **GitHub and npm domains are exfiltration channels.** Any file or secret reachable by the sandbox process can be sent to `github.com`, `registry.npmjs.org`, or any other allowed domain. Do not run untrusted code in this profile.
- **Permission prompts are retained** by default (unless `--dangerously-skip-permissions` is supplied), but a malicious tool call could still exfiltrate data through allowed network domains without triggering a filesystem-write prompt.
- **Docker Hub domains are included.** Pulling images is allowed by default; this is a relatively broad egress surface.
