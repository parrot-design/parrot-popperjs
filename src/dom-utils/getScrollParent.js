import getNodeName from "./getNodeName";
import getParentNode from "./getParentNode";
import { isHTMLElement } from "./instanceof";
import isScrollParent from "./isScrollParent";

export default function getScrollParent(node){ 
    if(['html','body','#document'].indexOf(getNodeName(node))>-0){
        return node.ownerDocument.body;
    }

    if(isHTMLElement(node) && isScrollParent(node)){
        return node;
    }

    return getScrollParent(getParentNode(node));
}