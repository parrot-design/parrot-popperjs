import { isElement } from './instanceof';

export default function getDocumentElement(
    element
) {
    return (
        (isElement(element)
            ? element.ownerDocument
            : element.document) || window.document
    ).documentElement;
}