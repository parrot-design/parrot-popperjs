// @flow
import getNodeName from './getNodeName';

export default function isTableElement(element) {
  return ['table', 'td', 'th'].indexOf(getNodeName(element)) >= 0;
}
