**Reviewer:** openai-codex/gpt-5.5 via pi

### Outcome

**Verdict:** Approved

**Reasoning:** The diff satisfies the pnpm migration and sandbox-profile requirements without introducing blocking issues. I verified `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build`, and rendered iOS package-manager exclusion checks locally.

### Strengths

- `package.json:9-15`, `justfile:4-29`, and `pnpm-workspace.yaml:1-2` consistently switch project workflows to pnpm, pin `packageManager` to `pnpm@11.1.1`, and include the required esbuild build-script approval.
- `src/profiles/interactive.ts:25-51`, `src/profiles/build.ts:5-14`, and `src/commands/bootstrap.ts:18-28` add pnpm macOS store/cache allowances in the requested profiles while preserving existing `~/.npm` behavior.
- `src/profiles/index.ts:9-23` and `src/profiles/ios.ts:4-55` make iOS an explicit profile allowlist instead of composing from `INTERACTIVE_PROFILE`, preventing future package-manager allowances from leaking into rendered iOS policies.
- `tests/profiles/interactive.test.ts`, `tests/profiles/build.test.ts`, and `tests/profiles/ios.test.ts` add targeted coverage for the new pnpm allow-list behavior and iOS package-manager/domain exclusions.
- Documentation updates in `README.md` and `docs/profiles/ios.md:5-73` accurately communicate pnpm usage and the explicit iOS filesystem/network stance.

### Issues

#### Critical (Must Fix)

_None._

#### Important (Should Fix)

_None._

#### Minor (Nice to Have)

_None._

### Recommendations

_None._
