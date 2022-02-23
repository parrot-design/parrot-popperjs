import {
    variationPlacements,
    basePlacements,
    placements as allPlacements
} from '../enums';
import getVariation from './getVariation';

//计算位置
export default function computeAutoPlacement(
    state,
    options
){
    const {
        placement,
        boundary
    }=options;

    const variation=getVariation(placement);
}