import { getWindow } from '@parrotjs/dom-utils';
//监听滚动事件和size变化
const passive={passive:true};

function effect({state,instance,options}:any){ 
    
    const { scroll = true, resize = true } = options;

    const window=getWindow(state.elements.popper);

    const scrollParents=[
        ...state.scrollParents.reference,
        ...state.scrollParents.popper
    ]; 

    if(scroll){
        scrollParents.forEach(scrollParent=>{
            scrollParent.addEventListener('scroll',instance.update,passive);
        })
    }

    if(resize){
        window.addEventListener('resize',instance.update,passive)
    }

    return ()=>{
        if(scroll){
            scrollParents.forEach(scrollParent => {
                scrollParent.removeEventListener('scroll', instance.update, passive);
            });
        }
        if (resize) {
            window.removeEventListener('resize', instance.update, passive);
        }
    }
}

export default ({
    name: 'eventListeners',
    enabled: true,
    phase: 'write',
    fn: () => {},
    effect,
    data: {},
});