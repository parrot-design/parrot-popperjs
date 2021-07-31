declare const createPopper: (reference: any, popper: any, options?: any) => {
    state: import(".").ICreatePopperState;
    setOptions(options: import(".").ICreatePopperOptions): Promise<unknown>;
    update(): Promise<unknown>;
    forceUpdate(): void;
};
export default createPopper;
