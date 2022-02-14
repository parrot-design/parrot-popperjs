import isHTMLElement from './util/isHTMLElement';
import getBoundingClientRect from './util/getBoundingClientRect';
import hasNotStaticPosition from './util/hasNotStaticParent';
import getAbsoluteStyle from './util/getAbsoluteStyle'
import getComputedStyle from './util/getComputedStyle';

export function createPopper(reference:HTMLElement,popper:HTMLElement){
    if(!isHTMLElement(reference)){
        throw new Error("this first argument must be a element");
    }
    if(!isHTMLElement(popper)){
        throw new Error("this secord argument must be a element");
    }
    //先设置absolute 便于正确计算元素宽度 absolute元素具有包裹性 
    //popper.setAttribute('style','position:absolute;');
    //由于absolute包含块的影响 popper元素的宽度将和他的包含块保持一致 会影响逻辑判断 包含块是第一个不为static的父元素
    // popper.setAttribute('style','width:max-content');

    //获取元素
    const parent=hasNotStaticPosition(popper);
    let parentRect:DOMRect|null=null;

    //rect
    const referenceRect=getBoundingClientRect(reference); 
    const popperRect=getBoundingClientRect(popper);  

    console.log("===popper===",getComputedStyle(popper)) 

    if(parent){
        parentRect=getBoundingClientRect(parent)||null;
    } 
    
    //如果存在
    if(parentRect){
      popper.setAttribute('style',getAbsoluteStyle(referenceRect,popperRect,parentRect));
    }else{
      popper.setAttribute('style',getAbsoluteStyle(referenceRect,popperRect));
    }
}