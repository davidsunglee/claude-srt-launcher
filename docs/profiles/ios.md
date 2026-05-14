# Profile: `ios`

[← Back to README](../../README.md)

The `ios` profile is for iOS Simulator build and test workflows. It is an explicit allowlist of Xcode-specific filesystem paths, Apple developer infrastructure, and the GitHub Git-fetch domains Swift Package Manager needs to resolve dependencies. It does **not** inherit the full `interactive` package-manager allowance set — npm, pnpm, Yarn, PyPI, Cargo, Go, RubyGems, Maven, and Docker registry domains are not granted to `ios`.

> **Profile name note:** The name `ios` is fixed by the spec to align with the existing safehouse alias naming convention. Do not rename it.

---

## When to use

Use `ios` when Claude Code needs to invoke `xcodebuild`, run tests in the iOS Simulator, resolve Swift Package Manager dependencies, or otherwise work within a standard Xcode workflow. Not appropriate for archive/export or physical-device workflows without the `--unsafe=ios-codesigning` override.

---

## Default filesystem stance

**Allow read:**
- `<workspace>` — your project directory
- `<claude-state>` — isolated Claude configuration/state
- `/Applications/Xcode.app` — Xcode app bundle
- `/Library/Developer/CommandLineTools` — Xcode Command Line Tools
- `/Library/Developer` — system developer directory
- `~/Library/Developer/Xcode` — Xcode user data
- `~/Library/Developer/CoreSimulator` — Simulator runtimes and data
- `~/Library/Caches/com.apple.dt.Xcode` — Xcode cache
- `~/Library/Caches/org.swift.swiftpm` — Swift PM cache
- `~/Library/Caches/com.apple.iphonesimulator` — Simulator cache
- `~/Library/Preferences/com.apple.dt.Xcode.plist` — Xcode preferences

**Allow write:**
- `<workspace>` — your project directory
- `<claude-state>` — isolated Claude configuration/state
- `~/Library/Developer/Xcode/DerivedData` — build artifacts
- `~/Library/Developer/CoreSimulator/Devices` — Simulator device state
- `~/Library/Caches/com.apple.dt.Xcode`
- `~/Library/Caches/org.swift.swiftpm`
- `~/Library/Caches/com.apple.iphonesimulator`
- `~/Library/Logs/CoreSimulator` — Simulator logs
- `/tmp`, `$TMPDIR` — temporary files

**Mach lookup (XPC services):**
- `com.apple.iphonesimulator.*`
- `com.apple.CoreSimulator.*`
- `com.apple.dt.Xcode.*`

Note: `~/.npm`, `~/Library/pnpm`, `~/Library/Caches/pnpm`, `~/.yarn`, `~/.cache`, `~/.cargo`, `~/.rustup`, `~/.rbenv`, `~/.pyenv`, and `~/go` are **not** in the `ios` allow lists. iOS workflows that need Node-side tooling should hydrate those caches under a different profile and run the iOS build separately.

---

## Default network stance

Claude service access is always included. In addition, `ios` allows the following domains:

**Apple developer infrastructure:**
- `developer.apple.com`
- `xcode.apple.com`
- `swcdn.apple.com`
- `updates.cdn-apple.com`

**App Store CDN / GSA:**
- `gs.apple.com`, `gsa.apple.com`
- `devimages.apple.com`, `devimages-cdn.apple.com`
- `*.mzstatic.com`

**Swift package registry:**
- `package-registry.swift.org`

**GitHub Git-fetch (for Swift Package Manager dependencies):**
- `github.com`, `*.github.com`, `api.github.com`, `raw.githubusercontent.com`, `objects.githubusercontent.com`, `codeload.github.com`, `lfs.github.com`

The `ios` profile does **not** include npm, Yarn, PyPI, Cargo, Go, RubyGems, Maven, or Docker registry domains. If you need those for a hybrid iOS + Node project, run the Node side under [`interactive`](interactive.md) separately.

---

## What is still denied by default

The following paths are in `denyRead` by default:

- `~/Library/Keychains` — host code-signing keychain
- `~/Library/MobileDevice/Provisioning Profiles` — provisioning profiles for physical devices
- `~/Library/MobileDevice/Devices` — paired physical device records

These are denied because Simulator-only workflows do not require them, and exposing them would give the sandbox access to host code-signing credentials.

---

## Unsafe override for codesigning

Pass `--unsafe=ios-codesigning` to remove `~/Library/Keychains` and `~/Library/MobileDevice/Provisioning Profiles` from `denyRead` and add them to `allowRead`.

**This override is required for archive/export workflows** that sign an `.ipa` for distribution, since those workflows read the keychain and provisioning profiles.

**Warning:** `--unsafe=ios-codesigning` exposes host code-signing credentials to any code running inside the sandbox. A malicious or compromised tool call could read and exfiltrate your signing certificates and provisioning profiles. Only use this override in sessions where you trust all tool calls being made.
