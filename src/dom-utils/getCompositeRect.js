import { isHTMLElement } from "./instanceof";
import { round } from '../util/math';
import getDocumentElement from '../dom-utils/getDocumentElement';
import getBoundingClientRect from "./getBoundingClientRect";
import getNodeName from "./getNodeName";
import getNodeScroll from './getNodeScroll';

//rect会受到transform属性的影响
function isElementScaled(element) {
    const rect = element.getBoundingClientRect();
    const scaleX = round(rect.width) / element.offsetWidth || 1;
    const scaleY = round(rect.height) / element.offsetHeight || 1;

    return scaleX !== 1 || scaleY !== 1;
}

export default function getCompositeRect(
    elementOrVirtualElement,
    offsetParent,
    isFixed = false
) { 
    const isOffsetParentAnElement = isHTMLElement(offsetParent);
    const offsetParentIsScaled =
        isHTMLElement(offsetParent) && isElementScaled(offsetParent);
    const documentElement = getDocumentElement(offsetParent);
    const rect = getBoundingClientRect(
        elementOrVirtualElement,
        offsetParentIsScaled
    );
    
    let scroll = { scrollLeft: 0, scrollTop: 0 };
    let offsets = { x: 0, y: 0 };

    if (isOffsetParentAnElement || (!isOffsetParentAnElement && !isFixed)) {
        if (
            getNodeName(offsetParent) !== 'body' || isScrollParent(documentElement)
        ) {
            scroll = getNodeScroll(offsetParent)
        }

        if (isHTMLElement(offsetParent)) {
            offsets = getBoundingClientRect(offsetParent, true);
            //clientLeft相当于边框的宽度
            offsets.x += offsetParent.clientLeft;
            offsets.y += offsetParent.clientTop;
        } else if (documentElement) {
            offsets.x = getWindowScrollBarX(documentElement);
        }
    } 

    return {
        x: rect.left + scroll.scrollLeft - offsets.x,
        y: rect.right + scroll.scrollTop - offsets.y,
        width: rect.width,
        height: rect.height
    }
}