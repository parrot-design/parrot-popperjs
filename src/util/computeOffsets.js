 
import getBasePlacement from "./getBasePlacement";
import getMainAxisFromPlacement from "./getMainAxisFromPlacement";
import getVariation from "./getVariation";

export default function computeOffsets({
    reference,
    popper,
    placement
}){
    const basePlacement = placement ? getBasePlacement(placement) : null;
    const variation = placement ? getVariation(placement) : null;
    //commonX
    const commonX = reference.x + reference.width / 2 - popper.width / 2;
    //commonY
    const commonY= reference.y + reference.height / 2 - popper.height / 2;

    let offsets;
    switch(basePlacement){
        case 'top':
            offsets={
                x:commonX,
                y:reference.y - popper.height
            };
            break; 
        case 'bottom':
            offsets={
                x:commonX,
                y:reference.y + reference.height
            };
            break;
        case 'right':
            offsets={
                x:reference.x + reference.width,
                y:commonY
            }
            break;
        case 'left':
            offsets={
                x:reference.x - popper.width,
                y:commonY
            }
            break;
        default:
            offsets={
                x:reference.x,
                y:reference.y
            }
    }

    const mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;

    const len = mainAxis === 'y' ? 'height' : 'width';

    // switch(variation){
    //     case 'start':
    //         offsets[mainAxis]=offsets[mainAxis]
    // }

    return offsets;
}