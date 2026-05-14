import type { PolicyFragment } from '../profiles/types.js';

function concatUnique(a: string[] | undefined, b: string[] | undefined): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of [...(a ?? []), ...(b ?? [])]) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

export function compose(fragments: PolicyFragment[]): PolicyFragment {
  return fragments.reduce<PolicyFragment>((acc, frag) => {
    const result: PolicyFragment = {};

    const hasNetwork = acc.network !== undefined || frag.network !== undefined;
    if (hasNetwork) {
      const an = acc.network ?? {};
      const fn = frag.network ?? {};
      result.network = {
        allowedDomains: concatUnique(an.allowedDomains, fn.allowedDomains),
        deniedDomains: concatUnique(an.deniedDomains, fn.deniedDomains),
        allowUnixSockets: concatUnique(an.allowUnixSockets, fn.allowUnixSockets),
        allowMachLookup: concatUnique(an.allowMachLookup, fn.allowMachLookup),
      };
      const lb = fn.allowLocalBinding !== undefined ? fn.allowLocalBinding : an.allowLocalBinding;
      if (lb !== undefined) result.network.allowLocalBinding = lb;
      const aus = fn.allowAllUnixSockets !== undefined ? fn.allowAllUnixSockets : an.allowAllUnixSockets;
      if (aus !== undefined) result.network.allowAllUnixSockets = aus;
    }

    const hasFs = acc.filesystem !== undefined || frag.filesystem !== undefined;
    if (hasFs) {
      const af = acc.filesystem ?? {};
      const ff = frag.filesystem ?? {};
      result.filesystem = {
        denyRead: concatUnique(af.denyRead, ff.denyRead),
        allowRead: concatUnique(af.allowRead, ff.allowRead),
        allowWrite: concatUnique(af.allowWrite, ff.allowWrite),
        denyWrite: concatUnique(af.denyWrite, ff.denyWrite),
      };
    }

    const wns = frag.enableWeakerNestedSandbox !== undefined
      ? frag.enableWeakerNestedSandbox
      : acc.enableWeakerNestedSandbox;
    if (wns !== undefined) result.enableWeakerNestedSandbox = wns;

    const wni = frag.enableWeakerNetworkIsolation !== undefined
      ? frag.enableWeakerNetworkIsolation
      : acc.enableWeakerNetworkIsolation;
    if (wni !== undefined) result.enableWeakerNetworkIsolation = wni;

    const allowPty = frag.allowPty !== undefined ? frag.allowPty : acc.allowPty;
    if (allowPty !== undefined) result.allowPty = allowPty;

    return result;
  }, {});
}
