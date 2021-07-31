
import computeOffsets from "../utils/computeOffsets";

function popperOffsets({state,name}:any){
    state.modifiersData[name]=computeOffsets({
        reference:state.rects.reference,
        element:state.rects.popper,
        placement: state.placement
    })
}

export default({
    name:'popperOffsets',
    enabled:true,
    phase:'read',
    fn: popperOffsets,
    data: {},
})