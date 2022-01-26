
import getComputedStyle from './getComputedStyle';
import isBodyHTML from './isBodyHTML';
//获取非static定位的元素
export default function hasNotStaticPosition(dom:HTMLElement){ 
    let parent:HTMLElement|null=null;
    //如果有父节点
    while(dom.parentNode){  
        dom=(dom.parentNode as HTMLElement);
        if(dom){  
            let position=getComputedStyle(dom,'position');
            //如果有定位或者是body 
            if(position!=='static'||isBodyHTML(dom)) {
                //parent为position值为非static的
                if(!isBodyHTML(dom)){
                    parent=dom;
                } 
                break;
            }
        }
        
    }
    //如果存在有祖先节点有position为非static值的
    return parent;
    
}