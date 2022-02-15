 
import isHTMLElement from '../util/isHTMLElement'

function applyStyles({state}){
    Object.keys(state.elements).forEach((name)=>{
        const style = state.styles[name] || {};
        const attributes = state.attributes[name] || {};

        const element = state.elements[name];

        if(!isHTMLElement(element)){
            return ;
        }

        Object.assign(element.style,style); 
    })
}
 
//在第一次更新前执行effect
function effect({state}){
    const initialStyles={
        popper:{
            position:'absolute',
            left:'0',
            top:'0',
            margin:'0'
        },
        arrow:{
            position:'absolute'
        },
        reference:{}
    };

    //合并popperstyle
    Object.assign(state.elements.popper.style,initialStyles.popper);
    state.styles=initialStyles;

    //有arrow 合并arrowstyle
    if(state.elements.arrow){
        Object.assign(state.elements.arrow.style,initialStyles.arrow);
    }

    return ()=>{
        
    }
}

export default {
    name:'applyStyles',
    enabled:true,
    phase:'write',
    fn:applyStyles,
    effect:effect,
    requires:['computeStyles']
}