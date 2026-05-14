import { ALL_UNSAFE_OVERRIDES, type PolicyFragment, type UnsafeOverride } from '../profiles/types.js';

export function parseUnsafeOverrides(value: string | undefined): Set<UnsafeOverride> {
  if (!value) return new Set();

  const tokens = value.split(',').map((t) => t.trim()).filter(Boolean);
  if (tokens.length === 0) return new Set();

  const result = new Set<UnsafeOverride>();
  for (const token of tokens) {
    if (!(ALL_UNSAFE_OVERRIDES as readonly string[]).includes(token)) {
      throw new Error(
        `unknown unsafe override "${token}". Allowed: ${ALL_UNSAFE_OVERRIDES.join(', ')}.`
      );
    }
    result.add(token as UnsafeOverride);
  }
  return result;
}

const IOS_PATHS = [
  '~/Library/Keychains',
  '~/Library/MobileDevice/Provisioning Profiles',
] as const;

export function applyUnsafeOverrides(
  fragment: PolicyFragment,
  granted: Set<UnsafeOverride>
): PolicyFragment {
  const result: PolicyFragment = {
    ...fragment,
    network: fragment.network ? { ...fragment.network } : undefined,
    filesystem: fragment.filesystem
      ? {
          ...fragment.filesystem,
          denyRead: fragment.filesystem.denyRead ? [...fragment.filesystem.denyRead] : [],
          denyWrite: fragment.filesystem.denyWrite ? [...fragment.filesystem.denyWrite] : [],
          allowRead: fragment.filesystem.allowRead ? [...fragment.filesystem.allowRead] : [],
          allowWrite: fragment.filesystem.allowWrite ? [...fragment.filesystem.allowWrite] : [],
        }
      : undefined,
  };

  if (granted.has('local-binding')) {
    result.network = { ...result.network, allowLocalBinding: true };
  }

  if (granted.has('all-unix-sockets')) {
    result.network = { ...result.network, allowAllUnixSockets: true };
  }

  if (granted.has('host-claude-home')) {
    if (result.filesystem?.denyRead) {
      result.filesystem.denyRead = result.filesystem.denyRead.filter((p) => p !== '~/.claude');
    }
    if (result.filesystem?.denyWrite) {
      result.filesystem.denyWrite = result.filesystem.denyWrite.filter((p) => p !== '~/.claude');
    }
  }

  if (granted.has('ios-codesigning')) {
    if (result.filesystem) {
      result.filesystem.denyRead = (result.filesystem.denyRead ?? []).filter(
        (p) => !(IOS_PATHS as readonly string[]).includes(p)
      );
      result.filesystem.allowRead = [
        ...(result.filesystem.allowRead ?? []),
        ...IOS_PATHS,
      ];
    }
  }

  // non-disposable-workspace and build-with-egress are no-ops here
  return result;
}
