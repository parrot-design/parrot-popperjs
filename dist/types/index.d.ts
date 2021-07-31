export { default as createPopper } from './popper';
export declare type Placement = 'top' | 'top-start' | 'top-end' | 'right' | 'right-start' | 'right-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'top-end' | 'auto' | 'auto-start' | 'auto-end';
export declare type Variation = 'start' | 'end';
export interface ICreatePopperState {
    placement: Placement;
    elements: any;
    attributes: any;
    options: ICreatePopperOptions;
    scrollParents?: any;
    orderedModifiers?: any;
    rects?: any;
    reset?: any;
    modifiersData?: any;
}
export interface ICreatePopperOptions {
    placement: 'top' | 'right' | 'bottom' | 'left';
    onFirstUpdate?: Function;
    modifiers?: any;
    strategy?: any;
}
