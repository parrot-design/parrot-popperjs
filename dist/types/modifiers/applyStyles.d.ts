declare function applyStyles({ state }: any): void;
declare function effect({ state }: any): () => void;
declare const _default: {
    name: string;
    enabled: boolean;
    phase: string;
    fn: typeof applyStyles;
    effect: typeof effect;
    requires: string[];
};
export default _default;
