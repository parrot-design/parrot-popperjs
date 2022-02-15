import getBasePlacement from '../util/getBasePlacement';
import getVariation from '../util/getVariation';

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
}){
    let { x=0,y=0 }=offsets;
    ({ x, y } = typeof roundOffsets === 'function'
          ? roundOffsets({ x, y })
          : { x, y });

    const hasX=offsets.hasOwnProperty('x');
    const hasY=offsets.hasOwnProperty('y');

    let sideX='left';
    let sideY='top';

    const win=window;

    if(adaptive){
        
    }

}

function computeStyles({state,options}){

    const {
        //是否使用gpu加速
        gpuAcceleration=true,
    }=options;

    const commonStyles={
        placement:getBasePlacement(state.placement),
        variation:getVariation(state.placement),
        popper:state.elements.popper,
        popperRect:state.rects.popper,
        gpuAcceleration,
        isFixed:state.options.strategy === 'fixed'
    };

    if(state.modifiersData.popperOffsets!=null){
        state.styles.popper={
            ...state.styles.popper,

        }
    }

}

export default {
    name:'computeStyles',
    enabled:true,
    fn:computeStyles
}