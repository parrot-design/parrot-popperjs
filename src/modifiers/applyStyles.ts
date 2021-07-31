
import { isHTMLElement,getNodeName } from '@parrotjs/dom-utils'

function applyStyles({state}:any){


    Object.keys(state.elements).forEach((name)=>{
        const style=state.styles[name]||{};

        const attributes=state.attributes[name]||{};
        const element=state.elements[name];

        if(!isHTMLElement(element) || !getNodeName(element)){
            return ;
        }

        Object.assign(element.style,style);

        Object.keys(attributes).forEach((name)=>{
            const value=attributes[name]

            if(value===false){
                element.removeAttribute(name);
            }else{
                element.setAttribute(name,value===true?'':value)
            }
        })
    })
}

function effect({state}:any){

    const initialStyles:any={
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
    }
   
    Object.assign(state.elements.popper.style,initialStyles.popper); 
    state.styles=initialStyles;

    if(state.elements.arrow){
        Object.assign(state.elements.arrow.style,initialStyles.arrow);
    }

    return ()=>{
        Object.keys(state.elements).forEach((name)=>{
            const element=state.elements[name];
            const attributes=state.attributes[name]||{};

            const styleProperties=Object.keys(
                state.styles.hasOwnProperty(name)
                ? state.styles[name]
                : initialStyles[name]
            );

            const style=styleProperties.reduce((style:any,property:string)=>{
                style[property]='';
                return style;
            },{})

            if (!isHTMLElement(element) || !getNodeName(element)) {
                return;
            }

            Object.assign(element.style, style);

            Object.keys(attributes).forEach((attribute) => {
                element.removeAttribute(attribute);
            });
        })
    }
}

export default ({
    name:'applyStyles',
    enabled:true,
    phase:'write',
    fn:applyStyles,
    effect,
    requires:['computedStyles']
})