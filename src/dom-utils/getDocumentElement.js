 
import { isElement } from './instanceOf'; 

export default function getDocumentElement(
  element 
) {
  // $FlowFixMe[incompatible-return]: assume body is always available
  return (
    (isElement(element)
      ? element.ownerDocument
      : // $FlowFixMe[prop-missing]
        element.document) || window.document
  ).documentElement;
}
