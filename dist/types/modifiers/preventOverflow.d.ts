declare function preventOverflow({ state, options, name }: any): void;
declare const _default: {
    name: string;
    enabled: boolean;
    phase: string;
    fn: typeof preventOverflow;
    requiresIfExists: string[];
};
export default _default;
