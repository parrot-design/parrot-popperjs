declare function effect({ state, instance, options }: any): () => void;
declare const _default: {
    name: string;
    enabled: boolean;
    phase: string;
    fn: () => void;
    effect: typeof effect;
    data: {};
};
export default _default;
