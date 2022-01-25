import isHTMLElement from './util/isHTMLElement';
import getBoundingClientRect from './util/getBoundingClientRect';

export function createPopper(reference:HTMLElement,popper:HTMLElement){
    if(!isHTMLElement(reference)){
        throw new Error("this first argument must be a element");
    }
    if(!isHTMLElement(popper)){
        throw new Error("this secord argument must be a element");
    }
    console.log(getBoundingClientRect(reference));
}