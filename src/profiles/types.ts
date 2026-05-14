export interface RenderedPolicy {
  network: {
    allowedDomains: string[];
    deniedDomains: string[];
    allowUnixSockets: string[];
    allowAllUnixSockets: boolean;
    allowLocalBinding: boolean;
    allowMachLookup: string[];
  };
  filesystem: {
    denyRead: string[];
    allowRead: string[];
    allowWrite: string[];
    denyWrite: string[];
  };
  enableWeakerNestedSandbox: boolean;
  enableWeakerNetworkIsolation: boolean;
}

export interface PolicyFragment {
  network?: {
    allowedDomains?: string[];
    deniedDomains?: string[];
    allowUnixSockets?: string[];
    allowAllUnixSockets?: boolean;
    allowLocalBinding?: boolean;
    allowMachLookup?: string[];
  };
  filesystem?: {
    denyRead?: string[];
    allowRead?: string[];
    allowWrite?: string[];
    denyWrite?: string[];
  };
  enableWeakerNestedSandbox?: boolean;
  enableWeakerNetworkIsolation?: boolean;
}

export type ProfileName = 'interactive' | 'build' | 'inspect' | 'ios';

export interface Substitutions {
  workspace: string;
  claudeState: string;
  tmpdir: string;
  home: string;
}

export type UnsafeOverride =
  | 'host-claude-home'
  | 'local-binding'
  | 'all-unix-sockets'
  | 'non-disposable-workspace'
  | 'build-with-egress'
  | 'ios-codesigning';

export const ALL_UNSAFE_OVERRIDES: readonly UnsafeOverride[] = [
  'host-claude-home',
  'local-binding',
  'all-unix-sockets',
  'non-disposable-workspace',
  'build-with-egress',
  'ios-codesigning',
];
