//判断是否是element元素
export default function isHTMLElement(dom:HTMLElement){
    //在chrome opera中 HTMLElement是function类型
    return typeof HTMLElement === 'object' ?
        dom instanceof HTMLElement :
        dom && typeof dom === 'object' && dom.nodeType === 1 && typeof dom.nodeName==='string';
}