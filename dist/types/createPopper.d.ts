import { ICreatePopperOptions, ICreatePopperState } from '.';
declare type PopperGeneratorArgs = {
    defaultModifiers?: any;
    defaultOptions?: any;
};
export declare function popperGenerator(generatorOptions?: PopperGeneratorArgs): (reference: any, popper: any, options?: any) => {
    state: ICreatePopperState;
    setOptions(options: ICreatePopperOptions): Promise<unknown>;
    update(): Promise<unknown>;
    forceUpdate(): void;
};
export {};
