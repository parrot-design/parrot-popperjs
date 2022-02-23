import getBasePlacement from '../util/getBasePlacement';
import getVariation from '../util/getVariation';
import getOffsetParent from '../dom-utils/getOffsetParent';
import { left, top, right, end, bottom } from '../enums';
import getWindow from '../dom-utils/getWindow';
import getDocumentElement from '../dom-utils/getDocumentElement';

export function mapToStyles({
    popper,
    popperRect,
    placement,
    variation,
    offsets,
    position,
    gpuAcceleration,
    adaptive,
    roundOffsets,
    isFixed
}) {
    let { x = 0, y = 0 } = offsets;
    ({ x, y } = typeof roundOffsets === 'function'
        ? roundOffsets({ x, y })
        : { x, y });

    const hasX = offsets.hasOwnProperty('x');
    const hasY = offsets.hasOwnProperty('y');

    let sideX = left;
    let sideY = top;

    const win = window;

    if (adaptive) {
        let offsetParent = getOffsetParent(popper);
        let heightProp = 'clientHeight';
        let widthProp = 'clientWidth';

        if (offsetParent === getWindow(popper)) {
            offsetParent = getDocumentElement(popper);

            if (getComputedStyle(offsetParent).position !== 'static' && position === 'absolute') {
                heightProp = 'scrollHeight';
                widthProp = 'scrollWidth';
            }
        }

        if (
            placement === top ||
            ((placement === left || placement === right) && variation === end)
        ) {
            sideY = bottom;
            const offsetY = isFixed && win.visualViewport
                ? win.visualViewport.height
                : offsetParent[heightProp];
            y -= offsetY - popperRect.height;
            y *= gpuAcceleration ? 1 : -1;
        }

        if (
            placement === left ||
            ((placement === top || placement === bottom) && variation === end)
        ) {
            sideX = right;
            const offsetX =
                isFixed && win.visualViewport
                    ? win.visualViewport.width
                    : // $FlowFixMe[prop-missing]
                    offsetParent[widthProp];
            x -= offsetX - popperRect.width;
            x *= gpuAcceleration ? 1 : -1;
        }

        const commonStyles = {
            position,
            ...(adaptive && unsetSides),
        };

        ({ x, y } =
            roundOffsets === true
                ? roundOffsetsByDPR({ x, y })
                : { x, y });

        if (gpuAcceleration) {
            return {
                ...commonStyles,
                [sideY]: hasY ? '0' : '',
                [sideX]: hasX ? '0' : '',
                // Layer acceleration can disable subpixel rendering which causes slightly
                // blurry text on low PPI displays, so we want to use 2D transforms
                // instead
                transform:
                    (win.devicePixelRatio || 1) <= 1
                        ? `translate(${x}px, ${y}px)`
                        : `translate3d(${x}px, ${y}px, 0)`,
            };
        }

        return {
            ...commonStyles,
            [sideY]: hasY ? `${y}px` : '',
            [sideX]: hasX ? `${x}px` : '',
            transform: '',
        };
    }

}

function computeStyles({ state, options }) {

    const {
        //是否使用gpu加速
        gpuAcceleration = true,
        //是否自适应
        adaptive = true,
        roundOffsets = true
    } = options;

    const commonStyles = {
        placement: getBasePlacement(state.placement),
        variation: getVariation(state.placement),
        popper: state.elements.popper,
        popperRect: state.rects.popper,
        gpuAcceleration,
        isFixed: state.options.strategy === 'fixed'
    };

    if (state.modifiersData.popperOffsets != null) {
        state.styles.popper = {
            ...state.styles.popper,
            ...mapToStyles({
                ...commonStyles,
                offsets: state.modifiersData.popperOffsets,
                position: state.options.strategy,
                adaptive,
                roundOffsets,
            }),
        }
    }

    if (state.modifiersData.arrow != null) {
        state.styles.arrow = {
            ...state.styles.arrow,
            ...mapToStyles({
                ...commonStyles,
                offsets: state.modifiersData.arrow,
                position: 'absolute',
                adaptive: false,
                roundOffsets,
            }),
        };
    }

    state.attributes.popper = {
        ...state.attributes.popper,
        'data-popper-placement': state.placement,
    };

}

export default {
    name: 'computeStyles',
    enabled: true,
    fn: computeStyles,
    phase: 'beforeWrite',
    data: {}
}