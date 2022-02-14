export default function getComputedStyle(dom:HTMLElement,attribute?:keyof CSSStyleDeclaration){ 
    return attribute ? window.getComputedStyle(dom)[attribute] : window.getComputedStyle(dom)
}   