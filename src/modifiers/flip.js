import getBasePlacement from "../util/getBasePlacement";
import getOppositePlacement from '../util/getOppositePlacement';
import getOppositeVariationPlacement from '../util/getOppositeVariationPlacement';


function getExpandedFallbackPlacements(placement)  {
    if (getBasePlacement(placement) === auto) {
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

    const {
        mainAxis: checkMainAxis = true,
        altAxis: checkAltAxis = true,
        fallbackPlacements: specifiedFallbackPlacements,
        padding,
        boundary,
        rootBoundary,
        altBoundary,
        flipVariations = true,
        allowedAutoPlacements
    } = options;

    const preferredPlacement = state.options.placement;
    const basePlacement = getBasePlacement(preferredPlacement);
    const isBasePlacement = basePlacement === preferredPlacement;

    const fallbackPlacements =
        specifiedFallbackPlacements ||
            (isBasePlacement || !flipVariations)
            ? [getOppositePlacement(preferredPlacement)]
            : getExpandedFallbackPlacements(preferredPlacement);

    
}


export default ({
    name: 'flip',
    enabled: true,
    phase: 'main',
    fn: flip,
    requiresIfExists: ['offset'],
    data: { _skip: false }
});