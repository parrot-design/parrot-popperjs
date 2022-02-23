import getWindow from './getWindow';
import { isHTMLElement } from './instanceof';
import getComputedStyle from './getComputedStyle';
import getNodeName from './getNodeName';
import getParentNode from './getParentNode';
import isTableElement from './isTableElement';

function getTrueOffsetParent(element) {
    if (
        !isHTMLElement(element) ||
        getComputedStyle(element).position === 'fixed'
    ) {
        return null;
    }
    return element.offsetParent;
}

//offsetParent在fixed元素中一直返回null 但是在absolute元素中返回其包含块
function getContainingBlock(element) {
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
    const isIE = navigator.userAgent.indexOf('Trident') !== -1;

    if (isIE && isHTMLElement(element)) {
        //在ie9、10和11中，包含块的固定元素总是由视口建立
        const elementCss = getComputedStyle(element);
        if (elementCss.position === 'fixed') {
            return null;
        }
    }

    let currentNode = getParentNode(element);

    while (
        isHTMLElement(currentNode) &&
        ['html', 'body'].indexOf(getNodeName(currentNode)) < 0
    ) {
        const css = getComputedStyle(currentNode);
        if (
            css.transform !== 'none' ||
            css.perspective !== 'none' ||
            css.contain === 'paint' ||
            ['transform', 'perspective'].indexOf(css.willChange) !== -1 ||
            (isFirefox && css.willChange === 'filter') ||
            (isFirefox && css.filter && css.filter !== 'none')
        ) {
            return currentNode;
        } else {
            currentNode = currentNode.parentNode;
        }
    }

    return null;
}

export default function getOffsetParent(element) {

    const window = getWindow(element);

    let offsetParent = getTrueOffsetParent(element);

    while (
        offsetParent &&
        isTableElement(offsetParent) &&
        getComputedStyle(offsetParent).position === 'static'
    ) {
        offsetParent = getTrueOffsetParent(offsetParent);
    }

    if (
        offsetParent &&
        (getNodeName(offsetParent) === 'html' ||
            (getNodeName(offsetParent) === 'body' &&
                getComputedStyle(offsetParent).position === 'static'))
    ) {
        return window;
    }

    return offsetParent || getContainingBlock(element) || window; 
}