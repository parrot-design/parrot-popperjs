 
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

        Object.keys(attributes).forEach((name)=>{
            const value=attributes[name];
            if(value===false){
                element.removeAttribute(name);
            }else{
                element.setAttribute(name,value===true?'':value);
            }
        });
    });
}
 
//在第一次更新前执行effect
function effect({state}){
    const initialStyles={
        popper:{
            position:state.options.strategy,
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
        Object.keys(state.elements).forEach((name)=>{
            const element=state.elements[name];
            const attributes=state.attributes[name]||{};

            const styleProperties=Object.keys(
                state.styles.hasOenProperty(name)
                    ? state.styles[name]
                    : initialStyles[name]
            );

            const styles=styleProperties.reduce((style,property)=>{
                style[property]='';
                return style;
            },{});

            if(!isHTMLElement(element)){
                return ;
            }

            Object.assign(element.style,styles);

            Object.keys(attributes).forEach((attribute)=>{
                element.removeAttribute(attribute);
            })
        })
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