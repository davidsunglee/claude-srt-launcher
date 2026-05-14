import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { PolicyFragment, RenderedPolicy } from '../profiles/types.js';

export function toRendered(fragment: PolicyFragment): RenderedPolicy {
  return {
    network: {
      allowedDomains: fragment.network?.allowedDomains ?? [],
      deniedDomains: fragment.network?.deniedDomains ?? [],
      allowUnixSockets: fragment.network?.allowUnixSockets ?? [],
      allowAllUnixSockets: fragment.network?.allowAllUnixSockets ?? false,
      allowLocalBinding: fragment.network?.allowLocalBinding ?? false,
      allowMachLookup: fragment.network?.allowMachLookup ?? [],
    },
    filesystem: {
      denyRead: fragment.filesystem?.denyRead ?? [],
      allowRead: fragment.filesystem?.allowRead ?? [],
      allowWrite: fragment.filesystem?.allowWrite ?? [],
      denyWrite: fragment.filesystem?.denyWrite ?? [],
    },
    enableWeakerNestedSandbox: fragment.enableWeakerNestedSandbox ?? false,
    enableWeakerNetworkIsolation: fragment.enableWeakerNetworkIsolation ?? false,
  };
}

export async function renderToTempfile(rendered: RenderedPolicy): Promise<string> {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'claude-srt-'));
  const filePath = path.join(dir, 'settings.json');
  await fs.promises.writeFile(filePath, JSON.stringify(rendered, null, 2));
  return filePath;
}
