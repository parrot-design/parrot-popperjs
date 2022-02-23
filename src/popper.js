
import { popperGenerator } from './createPopper';
import popperOffsets from './modifiers/popperOffsets';

const defaultModifiers=[
    popperOffsets
];

const createPopper=popperGenerator({defaultModifiers});

export { createPopper } 