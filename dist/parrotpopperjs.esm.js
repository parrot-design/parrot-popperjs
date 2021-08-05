import { isElement, listScrollParents, getCompositeRect, getOffsetParent, getLayoutRect, getWindow, isHTMLElement, getNodeName, getClippingRect, getDocumentElement, getBoundingClientRect, rectToClientRect, contains, getComputedStyle } from '@parrotjs/dom-utils';

function mergeByName(modifiers) {
    const merged = modifiers.reduce((merged, current) => {
        const existing = merged[current.name];
        merged[current.name] = existing
            ? Object.assign(Object.assign(Object.assign({}, existing), current), { options: Object.assign(Object.assign({}, existing.options), current.options), data: Object.assign(Object.assign({}, existing.data), current.data) }) : current;
        return merged;
    }, {});
    // IE11 does not support Object.values
    return Object.keys(merged).map(key => merged[key]);
}

const modifierPhases = [
    'beforeRead',
    'read',
    'afterRead',
    'beforeMain',
    'main',
    'afterMain',
    'beforeWrite',
    'write',
    'afterWrite'
];

function order(modifiers) {
    const map = new Map();
    const visited = new Set();
    const result = [];
    modifiers.forEach((modifier) => {
        map.set(modifier.name, modifier);
    });
    // On visiting object, check for its dependencies and visit them recursively
    function sort(modifier) {
        visited.add(modifier.name);
        const requires = [
            ...(modifier.requires || []),
            ...(modifier.requiresIfExists || []),
        ];
        requires.forEach(dep => {
            if (!visited.has(dep)) {
                const depModifier = map.get(dep);
                if (depModifier) {
                    sort(depModifier);
                }
            }
        });
        result.push(modifier);
    }
    modifiers.forEach((modifier) => {
        if (!visited.has(modifier.name)) {
            // check for visited object
            sort(modifier);
        }
    });
    return result;
}
function orderModifiers(modifiers) {
    // order based on dependencies
    const orderedModifiers = order(modifiers);
    // order based on phase
    return modifierPhases.reduce((acc, phase) => {
        return acc.concat(orderedModifiers.filter((modifier) => modifier.phase === phase));
    }, []);
}

function areValidElements(...args) {
    return !args.some((element) => !(element && typeof element.getBoundingClientRect === 'function'));
}

const DEFAULT_OPTIONS = {
    placement: 'bottom',
    modifiers: [],
    strategy: 'absolute'
};
function popperGenerator(generatorOptions = {}) {
    const { defaultModifiers = [], defaultOptions = DEFAULT_OPTIONS } = generatorOptions;
    return function createPopper(reference, popper, options = defaultOptions) {
        let state = {
            placement: 'bottom',
            elements: {
                reference,
                popper
            },
            options: Object.assign(Object.assign({}, DEFAULT_OPTIONS), defaultOptions),
            attributes: {},
            modifiersData: {}
        };
        let effectCleanupFns = [];
        let isDestroyed = false;
        const instance = {
            state,
            setOptions(options) {
                cleanupModifierEffects();
                state.options = Object.assign(Object.assign(Object.assign({}, defaultOptions), state.options), options);
                state.scrollParents = {
                    reference: isElement(reference)
                        ? listScrollParents(reference)
                        : reference.contextElement
                            ? listScrollParents(reference.contextElement)
                            : [],
                    popper: listScrollParents(popper)
                };
                //根据依赖项进行排序
                const orderedModifiers = orderModifiers(mergeByName([...defaultModifiers, ...state.options.modifiers]));
                state.orderedModifiers = orderedModifiers.filter((m) => m.enabled);
                runModifierEffects();
                return instance.update();
            },
            update() {
                return new Promise((resolve) => {
                    instance.forceUpdate();
                    resolve(state);
                });
            },
            destroy() {
                cleanupModifierEffects();
                isDestroyed = true;
            },
            forceUpdate() {
                if (isDestroyed) {
                    return;
                }
                const { reference, popper } = state.elements;
                //如果reference和popper不是合法节点就不处理
                if (!areValidElements(reference, popper)) {
                    return;
                }
                state.rects = {
                    reference: getCompositeRect(reference, getOffsetParent(popper), state.options.strategy === 'fixed'),
                    popper: getLayoutRect(popper),
                };
                state.reset = false;
                state.placement = state.options.placement;
                state.orderedModifiers.forEach((modifier) => (state.modifiersData[modifier.name] = Object.assign({}, modifier.data)));
                for (let index = 0; index < state.orderedModifiers.length; index++) {
                    if (state.reset === true) {
                        state.reset = false;
                        index = -1;
                        continue;
                    }
                    const { fn, options = {}, name } = state.orderedModifiers[index];
                    if (typeof fn === 'function') {
                        state = fn({ state, options, name, instance }) || state;
                    }
                }
            }
        };
        instance.setOptions(options).then((state) => {
            if (!isDestroyed && options.onFirstUpdate) {
                options.onFirstUpdate(state);
            }
        });
        function runModifierEffects() {
            state.orderedModifiers.forEach(({ name, options = {}, effect }) => {
                if (typeof effect === 'function') {
                    const cleanupFn = effect({ state, name, instance, options });
                    const noopFn = () => { };
                    effectCleanupFns.push(cleanupFn || noopFn);
                }
            });
        }
        function cleanupModifierEffects() {
            effectCleanupFns.forEach(fn => fn());
            effectCleanupFns = [];
        }
        return instance;
    };
}

//监听滚动事件和size变化
const passive = { passive: true };
function effect$2({ state, instance, options }) {
    const { scroll = true, resize = true } = options;
    const window = getWindow(state.elements.popper);
    const scrollParents = [
        ...state.scrollParents.reference,
        ...state.scrollParents.popper
    ];
    if (scroll) {
        scrollParents.forEach(scrollParent => {
            scrollParent.addEventListener('scroll', instance.update, passive);
        });
    }
    if (resize) {
        window.addEventListener('resize', instance.update, passive);
    }
    return () => {
        if (scroll) {
            scrollParents.forEach(scrollParent => {
                scrollParent.removeEventListener('scroll', instance.update, passive);
            });
        }
        if (resize) {
            window.removeEventListener('resize', instance.update, passive);
        }
    };
}
var eventListeners = ({
    name: 'eventListeners',
    enabled: true,
    phase: 'write',
    fn: () => { },
    effect: effect$2,
    data: {},
});

//获取基本位置
function getBasePlacement(placement) {
    return (placement.split('-')[0]);
}
const basePlacements = ['top', 'right', 'bottom', 'left'];
const autoPlacement = ['auto'];
const variationPlacements = basePlacements.reduce((acc, placement) => acc.concat([(`${placement}-start`), (`${placement}-end`)]), []);
const placements = [...basePlacements, ...autoPlacement].reduce((acc, placement) => acc.concat([
    placement,
    `${placement}-start`,
    `${placement}-end`
]), []);

function getMainAxisFromPlacement(placement) {
    return ['top', 'bottom'].indexOf(placement) >= 0 ? 'x' : 'y';
}

//获取第二位置
function getVariation(placement) {
    return placement.split('-')[1];
}

function computeOffsets({ reference, element, placement }) {
    const basePlacement = placement ? getBasePlacement(placement) : null;
    const variation = placement ? getVariation(placement) : null;
    const commonX = reference.x + reference.width / 2 - element.width / 2;
    const commonY = reference.y + reference.height / 2 - element.height / 2;
    let offsets;
    switch (basePlacement) {
        case 'top':
            offsets = {
                x: commonX,
                y: reference.y - element.height,
            };
            break;
        case 'bottom':
            offsets = {
                x: commonX,
                y: reference.y + reference.height,
            };
            break;
        case 'right':
            offsets = {
                x: reference.x + reference.width,
                y: commonY
            };
            break;
        case 'left':
            offsets = {
                x: reference.x - element.width,
                y: commonY,
            };
            break;
        default:
            offsets = {
                x: reference.x,
                y: reference.y,
            };
    }
    const mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;
    if (mainAxis != null) {
        const len = mainAxis === 'y' ? 'height' : 'width';
        switch (variation) {
            case 'start':
                offsets[mainAxis] = offsets[mainAxis] - (reference[len] / 2 - element[len] / 2);
                break;
            case 'end':
                offsets[mainAxis] = offsets[mainAxis] + (reference[len] / 2 - element[len] / 2);
                break;
        }
    }
    return offsets;
}

function popperOffsets({ state, name }) {
    state.modifiersData[name] = computeOffsets({
        reference: state.rects.reference,
        element: state.rects.popper,
        placement: state.placement
    });
}
var popperOffsets$1 = ({
    name: 'popperOffsets',
    enabled: true,
    phase: 'read',
    fn: popperOffsets,
    data: {},
});

function applyStyles({ state }) {
    Object.keys(state.elements).forEach((name) => {
        const style = state.styles[name] || {};
        const attributes = state.attributes[name] || {};
        const element = state.elements[name];
        if (!isHTMLElement(element) || !getNodeName(element)) {
            return;
        }
        Object.assign(element.style, style);
        Object.keys(attributes).forEach((name) => {
            const value = attributes[name];
            if (value === false) {
                element.removeAttribute(name);
            }
            else {
                element.setAttribute(name, value === true ? '' : value);
            }
        });
    });
}
function effect$1({ state }) {
    const initialStyles = {
        popper: {
            position: state.options.strategy,
            left: '0',
            top: '0',
            margin: '0'
        },
        arrow: {
            position: 'absolute'
        },
        reference: {}
    };
    Object.assign(state.elements.popper.style, initialStyles.popper);
    state.styles = initialStyles;
    if (state.elements.arrow) {
        Object.assign(state.elements.arrow.style, initialStyles.arrow);
    }
    return () => {
        Object.keys(state.elements).forEach((name) => {
            const element = state.elements[name];
            const attributes = state.attributes[name] || {};
            const styleProperties = Object.keys(state.styles.hasOwnProperty(name)
                ? state.styles[name]
                : initialStyles[name]);
            const style = styleProperties.reduce((style, property) => {
                style[property] = '';
                return style;
            }, {});
            if (!isHTMLElement(element) || !getNodeName(element)) {
                return;
            }
            Object.assign(element.style, style);
            Object.keys(attributes).forEach((attribute) => {
                element.removeAttribute(attribute);
            });
        });
    };
}
var applyStyles$1 = ({
    name: 'applyStyles',
    enabled: true,
    phase: 'write',
    fn: applyStyles,
    effect: effect$1,
    requires: ['computedStyles']
});

const hash$1 = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' };
function getOppositePlacement(placement) {
    return (placement.replace(/left|right|bottom|top/g, (matched) => hash$1[matched]));
}

const hash = { start: 'end', end: 'start' };
function getOppositeVariationPlacement(placement) {
    return (placement.replace(/start|end/g, (matched) => hash[matched]));
}

function getFreshSideObject() {
    return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    };
}

function mergePaddingObject(paddingObject) {
    return Object.assign(Object.assign({}, getFreshSideObject()), paddingObject);
}

function expandToHashMap(value, keys) {
    return keys.reduce((hashMap, key) => {
        hashMap[key] = value;
        return hashMap;
    }, {});
}

function detectOverflow(state, options = {}) {
    const { placement = state.placement, boundary = 'clippingParents', rootBoundary = 'viewport', elementContext = 'popper', altBoundary = false, padding = 0, } = options;
    const paddingObject = mergePaddingObject(typeof padding !== 'number'
        ? padding
        : expandToHashMap(padding, basePlacements));
    const altContext = elementContext === 'popper' ? 'reference' : 'popper';
    const referenceElement = state.elements.reference;
    const popperRect = state.rects.popper;
    const element = state.elements[altBoundary ? altContext : elementContext];
    const clippingClientRect = getClippingRect(isElement(element)
        ? element
        : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary);
    const referenceClientRect = getBoundingClientRect(referenceElement);
    const popperOffsets = computeOffsets({
        reference: referenceClientRect,
        element: popperRect,
        strategy: 'absolute',
        placement,
    });
    const popperClientRect = rectToClientRect(Object.assign(Object.assign({}, popperRect), popperOffsets));
    const elementClientRect = elementContext === 'popper' ? popperClientRect : referenceClientRect;
    // positive = overflowing the clipping rect
    // 0 or negative = within the clipping rect
    const overflowOffsets = {
        top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
        bottom: elementClientRect.bottom -
            clippingClientRect.bottom +
            paddingObject.bottom,
        left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
        right: elementClientRect.right - clippingClientRect.right + paddingObject.right,
    };
    const offsetData = state.modifiersData.offset;
    // Offsets can be applied only to the popper element
    if (elementContext === 'popper' && offsetData) {
        const offset = offsetData[placement];
        Object.keys(overflowOffsets).forEach((key) => {
            const multiply = ['right', 'bottom'].indexOf(key) >= 0 ? 1 : -1;
            const axis = ['top', 'bottom'].indexOf(key) >= 0 ? 'y' : 'x';
            overflowOffsets[key] += offset[axis] * multiply;
        });
    }
    return overflowOffsets;
}

function computeAutoPlacement(state, options = {}) {
    const { placement, boundary, rootBoundary, padding, flipVariations, allowedAutoPlacements = placements, } = options;
    const variation = getVariation(placement);
    const placements$1 = variation
        ? flipVariations
            ? variationPlacements
            : variationPlacements.filter((placement) => getVariation(placement) === variation)
        : basePlacements;
    let allowedPlacements = placements$1.filter((placement) => allowedAutoPlacements.indexOf(placement) >= 0);
    if (allowedPlacements.length === 0) {
        allowedPlacements = placements$1;
    }
    // $FlowFixMe[incompatible-type]: Flow seems to have problems with two array unions...
    const overflows = allowedPlacements.reduce((acc, placement) => {
        acc[placement] = detectOverflow(state, {
            placement,
            boundary,
            rootBoundary,
            padding,
        })[getBasePlacement(placement)];
        return acc;
    }, {});
    return Object.keys(overflows).sort((a, b) => overflows[a] - overflows[b]);
}

function getExpandedFallbackPlacements(placement) {
    if (getBasePlacement(placement) === 'auto') {
        return [];
    }
    const oppositePlacement = getOppositePlacement(placement);
    return [
        getOppositeVariationPlacement(placement),
        oppositePlacement,
        getOppositeVariationPlacement(oppositePlacement),
    ];
}
function flip({ state, options, name }) {
    if (state.modifiersData[name]._skip) {
        return;
    }
    const { mainAxis: checkMainAxis = true, altAxis: checkAltAxis = true, fallbackPlacements: specifiedFallbackPlacements, padding, boundary, rootBoundary, altBoundary, flipVariations = true, allowedAutoPlacements, } = options;
    const preferredPlacement = state.options.placement;
    const basePlacement = getBasePlacement(preferredPlacement);
    const isBasePlacement = basePlacement === preferredPlacement;
    const fallbackPlacements = specifiedFallbackPlacements ||
        (isBasePlacement || !flipVariations
            ? [getOppositePlacement(preferredPlacement)]
            : getExpandedFallbackPlacements(preferredPlacement));
    const placements = [preferredPlacement, ...fallbackPlacements].reduce((acc, placement) => {
        return acc.concat(getBasePlacement(placement) === 'auto'
            ? computeAutoPlacement(state, {
                placement,
                boundary,
                rootBoundary,
                padding,
                flipVariations,
                allowedAutoPlacements,
            })
            : placement);
    }, []);
    const referenceRect = state.rects.reference;
    const popperRect = state.rects.popper;
    const checksMap = new Map();
    let makeFallbackChecks = true;
    let firstFittingPlacement = placements[0];
    for (let i = 0; i < placements.length; i++) {
        const placement = placements[i];
        const basePlacement = getBasePlacement(placement);
        const isStartVariation = getVariation(placement) === 'start';
        const isVertical = ['top', 'bottom'].indexOf(basePlacement) >= 0;
        const len = isVertical ? 'width' : 'height';
        const overflow = detectOverflow(state, {
            placement,
            boundary,
            rootBoundary,
            altBoundary,
            padding,
        });
        let mainVariationSide = isVertical
            ? isStartVariation
                ? 'right'
                : 'left'
            : isStartVariation
                ? 'bottom'
                : 'top';
        if (referenceRect[len] > popperRect[len]) {
            mainVariationSide = getOppositePlacement(mainVariationSide);
        }
        const altVariationSide = getOppositePlacement(mainVariationSide);
        const checks = [];
        if (checkMainAxis) {
            checks.push(overflow[basePlacement] <= 0);
        }
        if (checkAltAxis) {
            checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
        }
        if (checks.every((check) => check)) {
            firstFittingPlacement = placement;
            makeFallbackChecks = false;
            break;
        }
        checksMap.set(placement, checks);
    }
    if (makeFallbackChecks) {
        // `2` may be desired in some cases – research later
        const numberOfChecks = flipVariations ? 3 : 1;
        for (let i = numberOfChecks; i > 0; i--) {
            const fittingPlacement = placements.find((placement) => {
                const checks = checksMap.get(placement);
                if (checks) {
                    return checks.slice(0, i).every((check) => check);
                }
            });
            if (fittingPlacement) {
                firstFittingPlacement = fittingPlacement;
                break;
            }
        }
    }
    if (state.placement !== firstFittingPlacement) {
        state.modifiersData[name]._skip = true;
        state.placement = firstFittingPlacement;
        state.reset = true;
    }
}
var filp = ({
    name: 'flip',
    enabled: true,
    phase: 'main',
    fn: flip,
    requiresIfExists: ['offset'],
    data: { _skip: false },
});

function getAltAxis(axis) {
    return axis === 'x' ? 'y' : 'x';
}

const max = Math.max;
const min = Math.min;
const round = Math.round;

function within(min$1, value, max$1) {
    return max(min$1, min(value, max$1));
}

function preventOverflow({ state, options, name }) {
    const { mainAxis: checkMainAxis = true, altAxis: checkAltAxis = false, boundary, rootBoundary, altBoundary, padding, tether = true, tetherOffset = 0, } = options;
    const overflow = detectOverflow(state, {
        boundary,
        rootBoundary,
        padding,
        altBoundary,
    });
    const basePlacement = getBasePlacement(state.placement);
    const variation = getVariation(state.placement);
    const isBasePlacement = !variation;
    const mainAxis = getMainAxisFromPlacement(basePlacement);
    const altAxis = getAltAxis(mainAxis);
    const popperOffsets = state.modifiersData.popperOffsets;
    const referenceRect = state.rects.reference;
    const popperRect = state.rects.popper;
    const tetherOffsetValue = typeof tetherOffset === 'function'
        ? tetherOffset(Object.assign(Object.assign({}, state.rects), { placement: state.placement }))
        : tetherOffset;
    const data = { x: 0, y: 0 };
    if (!popperOffsets) {
        return;
    }
    if (checkMainAxis || checkAltAxis) {
        const mainSide = mainAxis === 'y' ? 'top' : 'left';
        const altSide = mainAxis === 'y' ? 'bottom' : 'right';
        const len = mainAxis === 'y' ? 'height' : 'width';
        const offset = popperOffsets[mainAxis];
        const min$1 = popperOffsets[mainAxis] + overflow[mainSide];
        const max$1 = popperOffsets[mainAxis] - overflow[altSide];
        const additive = tether ? -popperRect[len] / 2 : 0;
        const minLen = variation === 'start' ? referenceRect[len] : popperRect[len];
        const maxLen = variation === 'start' ? -popperRect[len] : -referenceRect[len];
        // We need to include the arrow in the calculation so the arrow doesn't go
        // outside the reference bounds
        const arrowElement = state.elements.arrow;
        const arrowRect = tether && arrowElement
            ? getLayoutRect(arrowElement)
            : { width: 0, height: 0 };
        const arrowPaddingObject = state.modifiersData['arrow#persistent']
            ? state.modifiersData['arrow#persistent'].padding
            : getFreshSideObject();
        const arrowPaddingMin = arrowPaddingObject[mainSide];
        const arrowPaddingMax = arrowPaddingObject[altSide];
        // If the reference length is smaller than the arrow length, we don't want
        // to include its full size in the calculation. If the reference is small
        // and near the edge of a boundary, the popper can overflow even if the
        // reference is not overflowing as well (e.g. virtual elements with no
        // width or height)
        const arrowLen = within(0, referenceRect[len], arrowRect[len]);
        const minOffset = isBasePlacement
            ? referenceRect[len] / 2 -
                additive -
                arrowLen -
                arrowPaddingMin -
                tetherOffsetValue
            : minLen - arrowLen - arrowPaddingMin - tetherOffsetValue;
        const maxOffset = isBasePlacement
            ? -referenceRect[len] / 2 +
                additive +
                arrowLen +
                arrowPaddingMax +
                tetherOffsetValue
            : maxLen + arrowLen + arrowPaddingMax + tetherOffsetValue;
        const arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
        const clientOffset = arrowOffsetParent
            ? mainAxis === 'y'
                ? arrowOffsetParent.clientTop || 0
                : arrowOffsetParent.clientLeft || 0
            : 0;
        const offsetModifierValue = state.modifiersData.offset
            ? state.modifiersData.offset[state.placement][mainAxis]
            : 0;
        const tetherMin = popperOffsets[mainAxis] + minOffset - offsetModifierValue - clientOffset;
        const tetherMax = popperOffsets[mainAxis] + maxOffset - offsetModifierValue;
        if (checkMainAxis) {
            const preventedOffset = within(tether ? min(min$1, tetherMin) : min$1, offset, tether ? max(max$1, tetherMax) : max$1);
            popperOffsets[mainAxis] = preventedOffset;
            data[mainAxis] = preventedOffset - offset;
        }
        if (checkAltAxis) {
            const mainSide = mainAxis === 'x' ? 'top' : 'left';
            const altSide = mainAxis === 'x' ? 'bottom' : 'right';
            const offset = popperOffsets[altAxis];
            const min$1 = offset + overflow[mainSide];
            const max$1 = offset - overflow[altSide];
            const preventedOffset = within(tether ? min(min$1, tetherMin) : min$1, offset, tether ? max(max$1, tetherMax) : max$1);
            popperOffsets[altAxis] = preventedOffset;
            data[altAxis] = preventedOffset - offset;
        }
    }
    state.modifiersData[name] = data;
}
var preventOverflow$1 = ({
    name: 'preventOverflow',
    enabled: true,
    phase: 'main',
    fn: preventOverflow,
    requiresIfExists: ['offset'],
});

const toPaddingObject = (padding, state) => {
    padding =
        typeof padding === 'function'
            ? padding(Object.assign(Object.assign({}, state.rects), { placement: state.placement }))
            : padding;
    return mergePaddingObject(typeof padding !== 'number'
        ? padding
        : expandToHashMap(padding, basePlacements));
};
function arrow({ state, name, options }) {
    const arrowElement = state.elements.arrow;
    const popperOffsets = state.modifiersData.popperOffsets;
    const basePlacement = getBasePlacement(state.placement);
    const axis = getMainAxisFromPlacement(basePlacement);
    const isVertical = ['left', 'right'].indexOf(basePlacement) >= 0;
    const len = isVertical ? 'height' : 'width';
    if (!arrowElement || !popperOffsets) {
        return;
    }
    const paddingObject = toPaddingObject(options.padding, state);
    const arrowRect = getLayoutRect(arrowElement);
    const minProp = axis === 'y' ? 'top' : 'left';
    const maxProp = axis === 'y' ? 'bottom' : 'right';
    const endDiff = state.rects.reference[len] +
        state.rects.reference[axis] -
        popperOffsets[axis] -
        state.rects.popper[len];
    const startDiff = popperOffsets[axis] - state.rects.reference[axis];
    const arrowOffsetParent = getOffsetParent(arrowElement);
    const clientSize = arrowOffsetParent
        ? axis === 'y'
            ? arrowOffsetParent.clientHeight || 0
            : arrowOffsetParent.clientWidth || 0
        : 0;
    const centerToReference = endDiff / 2 - startDiff / 2;
    // Make sure the arrow doesn't overflow the popper if the center point is
    // outside of the popper bounds
    const min = paddingObject[minProp];
    const max = clientSize - arrowRect[len] - paddingObject[maxProp];
    const center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
    const offset = within(min, center, max);
    // Prevents breaking syntax highlighting...
    const axisProp = axis;
    state.modifiersData[name] = {
        [axisProp]: offset,
        centerOffset: offset - center,
    };
}
function effect({ state, options }) {
    let { element: arrowElement = '[data-popper-arrow]' } = options;
    if (arrowElement == null) {
        return;
    }
    // CSS selector
    if (typeof arrowElement === 'string') {
        arrowElement = state.elements.popper.querySelector(arrowElement);
        if (!arrowElement) {
            return;
        }
    }
    if (!contains(state.elements.popper, arrowElement)) {
        return;
    }
    state.elements.arrow = arrowElement;
}
var arrow$1 = ({
    name: 'arrow',
    enabled: true,
    phase: 'main',
    fn: arrow,
    effect,
    requires: ['popperOffsets'],
    requiresIfExists: ['preventOverflow'],
});

function getSideOffsets(overflow, rect, preventedOffsets = { x: 0, y: 0 }) {
    return {
        top: overflow.top - rect.height - preventedOffsets.y,
        right: overflow.right - rect.width + preventedOffsets.x,
        bottom: overflow.bottom - rect.height + preventedOffsets.y,
        left: overflow.left - rect.width - preventedOffsets.x,
    };
}
function isAnySideFullyClipped(overflow) {
    return ['top', 'right', 'bottom', 'left'].some((side) => overflow[side] >= 0);
}
function hide({ state, name }) {
    const referenceRect = state.rects.reference;
    const popperRect = state.rects.popper;
    const preventedOffsets = state.modifiersData.preventOverflow;
    const referenceOverflow = detectOverflow(state, {
        elementContext: 'reference',
    });
    const popperAltOverflow = detectOverflow(state, {
        altBoundary: true,
    });
    const referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
    const popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
    const isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
    const hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
    state.modifiersData[name] = {
        referenceClippingOffsets,
        popperEscapeOffsets,
        isReferenceHidden,
        hasPopperEscaped,
    };
    state.attributes.popper = Object.assign(Object.assign({}, state.attributes.popper), { 'data-popper-reference-hidden': isReferenceHidden, 'data-popper-escaped': hasPopperEscaped });
}
var hide$1 = ({
    name: 'hide',
    enabled: true,
    phase: 'main',
    requiresIfExists: ['preventOverflow'],
    fn: hide,
});

const unsetSides = {
    top: 'auto',
    right: 'auto',
    bottom: 'auto',
    left: 'auto',
};
// Round the offsets to the nearest suitable subpixel based on the DPR.
// Zooming can change the DPR, but it seems to report a value that will
// cleanly divide the values into the appropriate subpixels.
function roundOffsetsByDPR({ x, y }) {
    const win = window;
    const dpr = win.devicePixelRatio || 1;
    return {
        x: round(round(x * dpr) / dpr) || 0,
        y: round(round(y * dpr) / dpr) || 0,
    };
}
function mapToStyles({ popper, popperRect, placement, offsets, position, gpuAcceleration, adaptive, roundOffsets, }) {
    let { x = 0, y = 0 } = roundOffsets === true
        ? roundOffsetsByDPR(offsets)
        : typeof roundOffsets === 'function'
            ? roundOffsets(offsets)
            : offsets;
    const hasX = offsets.hasOwnProperty('x');
    const hasY = offsets.hasOwnProperty('y');
    let sideX = 'left';
    let sideY = 'top';
    const win = window;
    if (adaptive) {
        let offsetParent = getOffsetParent(popper);
        let heightProp = 'clientHeight';
        let widthProp = 'clientWidth';
        if (offsetParent === getWindow(popper)) {
            offsetParent = getDocumentElement(popper);
            if (getComputedStyle(offsetParent).position !== 'static') {
                heightProp = 'scrollHeight';
                widthProp = 'scrollWidth';
            }
        }
        // $FlowFixMe[incompatible-cast]: force type refinement, we compare offsetParent with window above, but Flow doesn't detect it
        offsetParent = offsetParent;
        if (placement === top) {
            sideY = 'bottom';
            // $FlowFixMe[prop-missing]
            y -= offsetParent[heightProp] - popperRect.height;
            y *= gpuAcceleration ? 1 : -1;
        }
        if (placement === 'left') {
            sideX = 'right';
            // $FlowFixMe[prop-missing]
            x -= offsetParent[widthProp] - popperRect.width;
            x *= gpuAcceleration ? 1 : -1;
        }
    }
    const commonStyles = Object.assign({ position }, (adaptive && unsetSides));
    if (gpuAcceleration) {
        return Object.assign(Object.assign({}, commonStyles), { [sideY]: hasY ? '0' : '', [sideX]: hasX ? '0' : '', 
            // Layer acceleration can disable subpixel rendering which causes slightly
            // blurry text on low PPI displays, so we want to use 2D transforms
            // instead
            transform: (win.devicePixelRatio || 1) < 2
                ? `translate(${x}px, ${y}px)`
                : `translate3d(${x}px, ${y}px, 0)` });
    }
    return Object.assign(Object.assign({}, commonStyles), { [sideY]: hasY ? `${y}px` : '', [sideX]: hasX ? `${x}px` : '', transform: '' });
}
function computeStyles({ state, options }) {
    const { gpuAcceleration = true, adaptive = true, 
    // defaults to use builtin `roundOffsetsByDPR`
    roundOffsets = true, } = options;
    const commonStyles = {
        placement: getBasePlacement(state.placement),
        popper: state.elements.popper,
        popperRect: state.rects.popper,
        gpuAcceleration,
    };
    if (state.modifiersData.popperOffsets != null) {
        state.styles.popper = Object.assign(Object.assign({}, state.styles.popper), mapToStyles(Object.assign(Object.assign({}, commonStyles), { offsets: state.modifiersData.popperOffsets, position: state.options.strategy, adaptive,
            roundOffsets })));
    }
    if (state.modifiersData.arrow != null) {
        state.styles.arrow = Object.assign(Object.assign({}, state.styles.arrow), mapToStyles(Object.assign(Object.assign({}, commonStyles), { offsets: state.modifiersData.arrow, position: 'absolute', adaptive: false, roundOffsets })));
    }
    state.attributes.popper = Object.assign(Object.assign({}, state.attributes.popper), { 'data-popper-placement': state.placement });
}
var computeStyles$1 = ({
    name: 'computeStyles',
    enabled: true,
    phase: 'beforeWrite',
    fn: computeStyles,
    data: {},
});

function distanceAndSkiddingToXY(placement, rects, offset) {
    const basePlacement = getBasePlacement(placement);
    const invertDistance = ['left', 'top'].indexOf(basePlacement) >= 0 ? -1 : 1;
    let [skidding, distance] = typeof offset === 'function'
        ? offset(Object.assign(Object.assign({}, rects), { placement }))
        : offset;
    skidding = skidding || 0;
    distance = (distance || 0) * invertDistance;
    return ['left', 'right'].indexOf(basePlacement) >= 0
        ? { x: distance, y: skidding }
        : { x: skidding, y: distance };
}
function offset({ state, options, name }) {
    const { offset = [0, 0] } = options;
    const data = placements.reduce((acc, placement) => {
        acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset);
        return acc;
    }, {});
    const { x, y } = data[state.placement];
    if (state.modifiersData.popperOffsets != null) {
        state.modifiersData.popperOffsets.x += x;
        state.modifiersData.popperOffsets.y += y;
    }
    state.modifiersData[name] = data;
}
var offset$1 = ({
    name: 'offset',
    enabled: true,
    phase: 'main',
    requires: ['popperOffsets'],
    fn: offset,
});

const defaultModifiers = [
    eventListeners,
    popperOffsets$1,
    applyStyles$1,
    filp,
    preventOverflow$1,
    arrow$1,
    hide$1,
    computeStyles$1,
    offset$1
];
const createPopper = popperGenerator({ defaultModifiers });

export { createPopper };
