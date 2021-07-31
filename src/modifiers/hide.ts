 
import detectOverflow from '../utils/detectOverflow';

function getSideOffsets(
    overflow:any,
    rect:any,
    preventedOffsets = { x: 0, y: 0 }
) {
    return {
        top: overflow.top - rect.height - preventedOffsets.y,
        right: overflow.right - rect.width + preventedOffsets.x,
        bottom: overflow.bottom - rect.height + preventedOffsets.y,
        left: overflow.left - rect.width - preventedOffsets.x,
    };
}

function isAnySideFullyClipped(overflow:any): boolean {
    return ['top', 'right', 'bottom', 'left'].some((side) => overflow[side] >= 0);
}

function hide({ state, name }: any) {
    const referenceRect = state.rects.reference;
    const popperRect = state.rects.popper;
    const preventedOffsets = state.modifiersData.preventOverflow;

    const referenceOverflow = detectOverflow(state, {
        elementContext: 'reference',
    });
    const popperAltOverflow = detectOverflow(state, {
        altBoundary: true,
    });

    const referenceClippingOffsets = getSideOffsets(
        referenceOverflow,
        referenceRect
    );
    const popperEscapeOffsets = getSideOffsets(
        popperAltOverflow,
        popperRect,
        preventedOffsets
    );

    const isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
    const hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);

    state.modifiersData[name] = {
        referenceClippingOffsets,
        popperEscapeOffsets,
        isReferenceHidden,
        hasPopperEscaped,
    };

    state.attributes.popper = {
        ...state.attributes.popper,
        'data-popper-reference-hidden': isReferenceHidden,
        'data-popper-escaped': hasPopperEscaped,
    };
}
 
export default ({
    name: 'hide',
    enabled: true,
    phase: 'main',
    requiresIfExists: ['preventOverflow'],
    fn: hide,
});