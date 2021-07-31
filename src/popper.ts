import { popperGenerator } from './createPopper';

import eventListeners from './modifiers/eventListener';
import popperOffsets from './modifiers/popperOffsets';
import applyStyles from './modifiers/applyStyles';
import filp from './modifiers/flip';
import preventOverflow from './modifiers/preventOverflow';
import arrow from './modifiers/arrow';
import hide from './modifiers/hide';
import computeStyles from './modifiers/computeStyles';
import offset from './modifiers/offset';

const defaultModifiers=[
    eventListeners,
    popperOffsets,
    applyStyles,
    filp,
    preventOverflow,
    arrow,
    hide,
    computeStyles,
    offset
];

const createPopper = popperGenerator({ defaultModifiers });

export default createPopper;