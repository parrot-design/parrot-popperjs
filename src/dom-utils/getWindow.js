export default function getWindow(node){
    if(node == null){
        return window;
    }

    if(node.toString()!=='[object Window]'){
        const ownDocument=node.ownerDocument;
        return ownDocument ? ownDocument.defaultView || window : window;
    }

    return node;
}