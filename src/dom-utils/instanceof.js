import getWindow from './getWindow';

function isElement(node){
    const OwnElement=getWindow(node).Element;
    return node instanceof OwnElement || node instanceof Element;
}

function isHTMLElement(node){
    const OwnElement=getWindow(node).HTMLElement;
    return node instanceof OwnElement || node instanceof HTMLElement;
}

function isShadowRoot(node){
    if(typeof ShadowRoot === 'undefined'){
        return false;
    }
    const OwnElement=getWindow(node).ShadowRoot;
    return node instanceof OwnElement || node instanceof ShadowRoot;
}

export {
    isElement,
    isHTMLElement,
    isShadowRoot
}