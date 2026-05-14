import type { PolicyFragment, Substitutions } from '../profiles/types.js';
import { expandTilde, expandTmpdir } from '../util/paths.js';

function substituteStr(s: string, subs: Substitutions): string {
  let r = s.replace(/<workspace>/g, subs.workspace);
  r = r.replace(/<claude-state>/g, subs.claudeState);
  r = expandTmpdir(r, subs.tmpdir);
  r = expandTilde(r, subs.home);
  return r;
}

function substituteArr(arr: string[] | undefined, subs: Substitutions): string[] | undefined {
  return arr?.map(s => substituteStr(s, subs));
}

export function substitute(fragment: PolicyFragment, subs: Substitutions): PolicyFragment {
  const result: PolicyFragment = {};

  if (fragment.network !== undefined) {
    result.network = {
      ...fragment.network,
      allowedDomains: substituteArr(fragment.network.allowedDomains, subs),
      deniedDomains: substituteArr(fragment.network.deniedDomains, subs),
      allowUnixSockets: substituteArr(fragment.network.allowUnixSockets, subs),
      allowMachLookup: substituteArr(fragment.network.allowMachLookup, subs),
    };
  }

  if (fragment.filesystem !== undefined) {
    result.filesystem = {
      denyRead: substituteArr(fragment.filesystem.denyRead, subs),
      allowRead: substituteArr(fragment.filesystem.allowRead, subs),
      allowWrite: substituteArr(fragment.filesystem.allowWrite, subs),
      denyWrite: substituteArr(fragment.filesystem.denyWrite, subs),
    };
  }

  if (fragment.enableWeakerNestedSandbox !== undefined) {
    result.enableWeakerNestedSandbox = fragment.enableWeakerNestedSandbox;
  }
  if (fragment.enableWeakerNetworkIsolation !== undefined) {
    result.enableWeakerNetworkIsolation = fragment.enableWeakerNetworkIsolation;
  }

  return result;
}
