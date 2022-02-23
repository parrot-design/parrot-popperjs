import { isElement } from "./dom-utils/instanceof";
import listScrollParents from "./dom-utils/listScrollParents";
import mergeByName from "./util/mergeByName";
import orderModifiers from './util/orderModifiers';
import getCompositeRect from './dom-utils/getCompositeRect';
import getLayoutRect from './dom-utils/getLayoutRect';
import getOffsetParent from './dom-utils/getOffsetParent';

const DEFAULT_OPTIONS={
    placement:'bottom',
    modifiers:[],
    strategy:'absolute'
}

function areValidElements(
    ...args
){
    return !args.some(element=>!(element && typeof element.getBoundingClientRect==='function'))
}

export function popperGenerator(generatorOptions={}){
    const {
        defaultModifiers=[],
        defaultOptions=DEFAULT_OPTIONS
    }=generatorOptions;

    return function createPopper(
        reference,
        popper,
        options=defaultOptions
    ){   
        let state={
            placement:'bottom',
            orderedModifiers:[],
            options:{...DEFAULT_OPTIONS,...defaultOptions},
            modifiersData:{},
            elements:{
                reference,
                popper
            },
            attributes:{},
            styles:{}
        };

        let effectCleanupFns=[];
        let isDestroyed=false;

        const instance={
            state,
            setOptions(setOptionsAction){ 
                const options=
                    typeof setOptionsAction === 'function'
                        ? setOptionsAction(state.options)
                        : setOptionsAction;
                
                cleanupModifierEffects();

                state.options={
                    ...defaultOptions,
                    ...state.options,
                    ...options
                };

             

                state.scrollParents={
                    reference:isElement(reference)
                        ? listScrollParents(reference)
                        : reference.contextElement
                        ? listScrollParents(reference.contextElement)
                        :[],
                    popper:listScrollParents(popper)
                }; 
             
                const orderedModifiers=orderModifiers(
                    mergeByName([...defaultModifiers,...state.options.modifiers])
                );
          
                state.orderedModifiers=orderedModifiers.filter(m=>m.enabled);
           
                runModifierEffects();

                return instance.update();
            },
            update:()=>{
                return new Promise((resolve)=>{
                    instance.forceUpdate(); 
                    resolve(state);
                })
            },
            destroy(){
                cleanupModifierEffects();
                isDestroyed=true;
            },
            forceUpdate(){
                if(isDestroyed){
                    return ;
                }
                const { reference,popper } =state.elements;
                if(!areValidElements(reference,popper)){
                    return ;
                }
                state.rects={
                    reference:getCompositeRect(
                        reference,
                        getOffsetParent(popper),
                        state.options.strategy==='fixed'
                    ),
                    popper:getLayoutRect(popper)
                }
 
                state.reset=false;

                state.placement=state.options.placement;

                state.orderedModifiers.forEach(
                    (modifier)=>
                        (state.modifiersData[modifier.name]={
                            ...modifier.data
                        })
                )

                for(let index=0;index<state.orderedModifiers.length;index++){
        
                    const { fn,options={},name}=state.orderedModifiers[index];

                    if(typeof fn==='function'){
                        state=fn({state,options,name,instance})||state;
                    }
                }

            }
        }

        instance.setOptions(options).then((state)=>{
            if(!isDestroyed && options.onFirstUpdate){
                options.onFirstUpdate();
            }
        })

        function runModifierEffects(){
            state.orderedModifiers.forEach(({name,options={},effect})=>{
                if(typeof effect==='function'){
                    const cleanupFn=effect({state,name,instance,options});
                    const noopFn=()=>{};
                    effectCleanupFns.push(cleanupFn||noopFn);
                }
            })
        }

        function cleanupModifierEffects(){
            effectCleanupFns.forEach((fn)=>fn());
            effectCleanupFns=[];
        }

        return instance;
    }
}