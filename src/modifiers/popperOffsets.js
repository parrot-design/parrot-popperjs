import computeOffsets from "../util/computeOffsets"

function popperOffsets({state,name}){ 
    state.modifiersData[name]=computeOffsets({
        reference:state.rects.reference,
        popper:state.rects.popper,
        strategy:'absolute',
        placement:state.placement
    }) 
}

export default {
    name:'popperOffsets',
    enabled:true,
    phase:'read',
    fn:popperOffsets,
    data:{}
}