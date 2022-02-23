import getNodeName from './getNodeName';
import getDocumentElement from './getDocumentElement';
import { isShadowRoot } from './instanceof';

export default function getParentNode(element){

    if(getNodeName(element)==='html'){
        return element;
    }

    return (
        element.assignedSlot||
        element.parentNode||
        (isShadowRoot(element) ? element.host : null) ||
        getDocumentElement(element)
    )

}