declare function arrow({ state, name, options }: any): void;
declare function effect({ state, options }: any): void;
declare const _default: {
    name: string;
    enabled: boolean;
    phase: string;
    fn: typeof arrow;
    effect: typeof effect;
    requires: string[];
    requiresIfExists: string[];
};
export default _default;
