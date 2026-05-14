#!/usr/bin/env bash
# Smoke-test matrix for claude-srt sandbox policy profiles.
#
# Each check is listed below with its expected outcome:
#
#   PASS  1  workspace write + read         — interactive can write/read inside $WS
#   PASS  2  network allow: GitHub          — interactive profile permits api.github.com
#   PASS  3  network allow: Claude platform — interactive profile permits platform.claude.com
#   DENY  1  SSH known_hosts read           — ~/.ssh/known_hosts is blocked
#   DENY  2  AWS credentials read           — ~/.aws/credentials is blocked
#   DENY  3  malicious domain network       — https://malicious.invalid.example is blocked
#   DENY  4  host ~/.claude read            — ~/.claude is blocked
#   DENY  5  Docker socket access           — /var/run/docker.sock is blocked (or SKIP)
#   DENY  6  OrbStack/colima socket         — ~/.orbstack or ~/.colima socket blocked (or SKIP)
#   DENY  7  denied host path writes        — writes to ~/.ssh, ~/.aws, ~/.claude artifacts
#                                             must fail AND leave no host-side file
#   DENY  8  unrelated home read            — ~/Documents read blocked (or SKIP if absent)
#   DENY  9  unrelated home write           — ~/Documents write blocked + no artifact (or SKIP)
#   PASS 10  inspect: test-output subdir   — inspect profile permits writes under $WS/test-output/
#   DENY 10  inspect: workspace-root write — inspect profile blocks writes directly to $WS
#   DENY 11  build: GitHub network          — build profile blocks api.github.com
#   PASS 12  terminal raw mode              — interactive TUIs can enable raw keyboard input
#   PASS 13  claude starts under wrapper    — claude --version works (or SKIP if not installed)

set -euo pipefail

PASS_COUNT=0
FAIL_COUNT=0

pass() {
    echo "PASS: $1"
    PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
    echo "FAIL: $1"
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

WS=$(mktemp -d -t claude-srt-smoke.XXXXXX)
STATE=$(mktemp -d -t claude-srt-state.XXXXXX)

# The inspect profile allows writes to /tmp and $TMPDIR. If the inspect-mode
# workspace lives under either of those roots, writes to the workspace root
# are implicitly permitted and the "deny workspace-root write" check below
# becomes vacuous. Place WS_INSPECT under the current working directory
# (the repo root when invoked via `pnpm smoke` / `just smoke`) so the
# workspace root is not nested under any other allow-write path.
SMOKE_PWD=$(pwd)
case "$SMOKE_PWD" in
    /tmp/*|/tmp|"${TMPDIR%/}"|"${TMPDIR%/}"/*)
        echo "ERROR: smoke test must be run from a working directory outside /tmp and \$TMPDIR" >&2
        echo "  current PWD: $SMOKE_PWD" >&2
        echo "  TMPDIR:      ${TMPDIR:-<unset>}" >&2
        exit 2
        ;;
esac
WS_INSPECT=$(mktemp -d "${SMOKE_PWD}/claude-srt-inspect-smoke.XXXXXX")

export WS STATE WS_INSPECT

trap 'rm -rf "$WS" "$STATE" "$WS_INSPECT"' EXIT

CLI="node dist/cli.js"

run_interactive() {
    $CLI exec --profile interactive --workspace "$WS" --state-dir "$STATE" -- "$@"
}

# ---------------------------------------------------------------------------
# PASS check 1: workspace write + read
# ---------------------------------------------------------------------------
if run_interactive bash -c 'echo hello > "$WS/inside.txt" && cat "$WS/inside.txt"' 2>/dev/null; then
    pass "workspace write + read"
else
    fail "workspace write + read"
fi

# ---------------------------------------------------------------------------
# PASS check 2: network allow — GitHub reachable in interactive
# ---------------------------------------------------------------------------
if run_interactive curl -fsS --max-time 8 -o /dev/null https://api.github.com 2>/dev/null; then
    pass "network allow: api.github.com"
else
    fail "network allow: api.github.com"
fi

# ---------------------------------------------------------------------------
# PASS check 3: network allow — Claude Code platform reachable in interactive
# ---------------------------------------------------------------------------
if run_interactive curl -fsS --max-time 8 -o /dev/null https://platform.claude.com 2>/dev/null; then
    pass "network allow: platform.claude.com"
else
    fail "network allow: platform.claude.com"
fi

# ---------------------------------------------------------------------------
# DENY check 1: SSH dir read denied
# ---------------------------------------------------------------------------
if run_interactive bash -c 'cat ~/.ssh/known_hosts' 2>/dev/null; then
    fail "deny: SSH known_hosts read"
else
    pass "deny: SSH known_hosts read"
fi

# ---------------------------------------------------------------------------
# DENY check 2: AWS credentials read denied
# ---------------------------------------------------------------------------
if run_interactive bash -c 'cat ~/.aws/credentials' 2>/dev/null; then
    fail "deny: AWS credentials read"
else
    pass "deny: AWS credentials read"
fi

# ---------------------------------------------------------------------------
# DENY check 3: network deny — malicious domain blocked
# ---------------------------------------------------------------------------
if run_interactive curl -fsS --max-time 8 -o /dev/null https://malicious.invalid.example 2>/dev/null; then
    fail "deny: malicious.invalid.example network"
else
    pass "deny: malicious.invalid.example network"
fi

# ---------------------------------------------------------------------------
# DENY check 4: host ~/.claude read denied
# ---------------------------------------------------------------------------
if run_interactive bash -c 'ls ~/.claude' 2>/dev/null; then
    fail "deny: host ~/.claude read"
else
    pass "deny: host ~/.claude read"
fi

# ---------------------------------------------------------------------------
# DENY check 5: Docker socket blocked (SKIP if host lacks socket)
# ---------------------------------------------------------------------------
if [ ! -e /var/run/docker.sock ]; then
    echo "SKIP: docker socket"
else
    if run_interactive bash -c '[ -e /var/run/docker.sock ] && nc -U /var/run/docker.sock < /dev/null' 2>/dev/null; then
        fail "deny: Docker socket access"
    else
        pass "deny: Docker socket access"
    fi
fi

# ---------------------------------------------------------------------------
# DENY check 6: OrbStack / colima socket (SKIP if neither exists on host)
# ---------------------------------------------------------------------------
ORBSTACK_SOCK="$HOME/.orbstack/run/docker.sock"
COLIMA_SOCK="$HOME/.colima/default/docker.sock"
if [ ! -e "$ORBSTACK_SOCK" ] && [ ! -e "$COLIMA_SOCK" ]; then
    echo "SKIP: orbstack socket"
else
    ORBS_FAILED=0
    for _sock in "$ORBSTACK_SOCK" "$COLIMA_SOCK"; do
        if [ -e "$_sock" ]; then
            if run_interactive bash -c "nc -U '$_sock' < /dev/null" 2>/dev/null; then
                ORBS_FAILED=1
            fi
        fi
    done
    if [ "$ORBS_FAILED" -eq 1 ]; then
        fail "deny: OrbStack/colima socket access"
    else
        pass "deny: OrbStack/colima socket access"
    fi
fi

# ---------------------------------------------------------------------------
# DENY check 7: denied host path writes — must fail AND leave no host artifact
# ---------------------------------------------------------------------------
# ~/.ssh/claude-srt-deny-test
if run_interactive bash -c 'echo pwned > ~/.ssh/claude-srt-deny-test' 2>/dev/null; then
    fail "deny: write to ~/.ssh/claude-srt-deny-test (sandbox allowed it)"
else
    if [ ! -e "$HOME/.ssh/claude-srt-deny-test" ]; then
        pass "deny: write to ~/.ssh/claude-srt-deny-test"
    else
        rm -f "$HOME/.ssh/claude-srt-deny-test"
        fail "deny: write to ~/.ssh/claude-srt-deny-test (host artifact found)"
    fi
fi

# ~/.aws/claude-srt-deny-test
if run_interactive bash -c 'echo pwned > ~/.aws/claude-srt-deny-test' 2>/dev/null; then
    fail "deny: write to ~/.aws/claude-srt-deny-test (sandbox allowed it)"
else
    if [ ! -e "$HOME/.aws/claude-srt-deny-test" ]; then
        pass "deny: write to ~/.aws/claude-srt-deny-test"
    else
        rm -f "$HOME/.aws/claude-srt-deny-test"
        fail "deny: write to ~/.aws/claude-srt-deny-test (host artifact found)"
    fi
fi

# ~/.claude/claude-srt-deny-test
if run_interactive bash -c 'echo pwned > ~/.claude/claude-srt-deny-test' 2>/dev/null; then
    fail "deny: write to ~/.claude/claude-srt-deny-test (sandbox allowed it)"
else
    if [ ! -e "$HOME/.claude/claude-srt-deny-test" ]; then
        pass "deny: write to ~/.claude/claude-srt-deny-test"
    else
        rm -f "$HOME/.claude/claude-srt-deny-test"
        fail "deny: write to ~/.claude/claude-srt-deny-test (host artifact found)"
    fi
fi

# ---------------------------------------------------------------------------
# DENY check 8: unrelated home read — ~/Documents blocked (SKIP if absent)
# ---------------------------------------------------------------------------
if [ ! -d "$HOME/Documents" ]; then
    echo "SKIP: ~/Documents missing"
else
    if run_interactive bash -c 'ls ~/Documents' 2>/dev/null; then
        fail "deny: ~/Documents read"
    else
        pass "deny: ~/Documents read"
    fi
fi

# ---------------------------------------------------------------------------
# DENY check 9: unrelated home write — ~/Documents blocked (SKIP if absent)
# ---------------------------------------------------------------------------
if [ ! -d "$HOME/Documents" ]; then
    echo "SKIP: ~/Documents missing"
else
    if run_interactive bash -c 'echo pwned > ~/Documents/claude-srt-deny-test' 2>/dev/null; then
        fail "deny: write to ~/Documents/claude-srt-deny-test (sandbox allowed it)"
    else
        if [ ! -e "$HOME/Documents/claude-srt-deny-test" ]; then
            pass "deny: write to ~/Documents/claude-srt-deny-test"
        else
            rm -f "$HOME/Documents/claude-srt-deny-test"
            fail "deny: write to ~/Documents/claude-srt-deny-test (host artifact found)"
        fi
    fi
fi

# ---------------------------------------------------------------------------
# inspect profile checks
#
# Uses $WS_INSPECT (created outside /tmp/$TMPDIR) so the workspace root is
# not nested under any allow-write path. See WS_INSPECT setup above.
# ---------------------------------------------------------------------------
run_inspect() {
    $CLI exec --profile inspect --workspace "$WS_INSPECT" --state-dir "$STATE" -- "$@"
}

# DENY check 10a: inspect blocks workspace-root write
if run_inspect bash -c 'echo nope > "$WS_INSPECT/blocked.txt"' 2>/dev/null; then
    fail "deny (inspect): workspace-root write"
else
    pass "deny (inspect): workspace-root write"
fi

# PASS check 10b: inspect allows write under test-output subdir
if run_inspect bash -c 'mkdir -p "$WS_INSPECT/test-output" && echo ok > "$WS_INSPECT/test-output/result.txt"' 2>/dev/null; then
    pass "inspect: write to test-output subdir"
else
    fail "inspect: write to test-output subdir"
fi

# ---------------------------------------------------------------------------
# build profile check: GitHub denied
# ---------------------------------------------------------------------------
touch "$WS/.srt-disposable"

if $CLI exec --profile build --workspace "$WS" --state-dir "$STATE" -- \
    curl -fsS --max-time 8 -o /dev/null https://api.github.com 2>/dev/null; then
    fail "deny (build): api.github.com network"
else
    pass "deny (build): api.github.com network"
fi

# ---------------------------------------------------------------------------
# PASS check 12: terminal raw mode works under SRT
# ---------------------------------------------------------------------------
RAW_CHECK="$WS/raw-mode-check.js"
cat > "$RAW_CHECK" <<'JS'
if (!process.stdin.isTTY || !process.stdout.isTTY) {
  process.exit(2);
}
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', (buf) => {
  if ([...buf].includes(113)) {
    process.stdin.setRawMode(false);
    process.exit(0);
  }
});
setTimeout(() => process.exit(3), 2000);
JS

if command -v script >/dev/null; then
    if printf '\033[Aq' | script -q "$WS/raw-mode.log" $CLI exec --profile interactive --workspace "$WS" --state-dir "$STATE" -- node "$RAW_CHECK" >/dev/null 2>&1; then
        pass "terminal raw mode under wrapper"
    else
        fail "terminal raw mode under wrapper"
    fi
else
    echo "SKIP: script command missing"
fi

# ---------------------------------------------------------------------------
# Final claude check
# ---------------------------------------------------------------------------
if command -v claude >/dev/null; then
    if run_interactive claude --version 2>/dev/null; then
        pass "claude starts under wrapper"
    else
        fail "claude starts under wrapper"
    fi
else
    echo "SKIP: claude not installed"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "passed=$PASS_COUNT failed=$FAIL_COUNT"
exit "$FAIL_COUNT"
