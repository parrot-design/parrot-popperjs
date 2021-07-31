 
import getBasePlacement,{basePlacements} from '../utils/getBasePlacement';
import { getLayoutRect,contains,getOffsetParent,isHTMLElement } from '@parrotjs/dom-utils';
import getMainAxisFromPlacement from '../utils/getMainAxisFromPlacement';
import within from '../utils/within';
import mergePaddingObject from '../utils/mergePaddingObject';
import expandToHashMap from '../utils/expandToHashMap';  
 
const toPaddingObject = (padding:any, state:any) => {
  padding =
    typeof padding === 'function'
      ? padding({ ...state.rects, placement: state.placement })
      : padding;

  return mergePaddingObject(
    typeof padding !== 'number'
      ? padding
      : expandToHashMap(padding, basePlacements)
  );
};

function arrow({ state, name, options }:any) {
  const arrowElement = state.elements.arrow;
  const popperOffsets = state.modifiersData.popperOffsets;
  const basePlacement = getBasePlacement(state.placement);
  const axis = getMainAxisFromPlacement(basePlacement);
  const isVertical = ['left', 'right'].indexOf(basePlacement) >= 0;
  const len = isVertical ? 'height' : 'width';

  if (!arrowElement || !popperOffsets) {
    return;
  }

  const paddingObject = toPaddingObject(options.padding, state);
  const arrowRect = getLayoutRect(arrowElement);
  const minProp = axis === 'y' ? 'top' : 'left';
  const maxProp = axis === 'y' ? 'bottom' : 'right';

  const endDiff =
    state.rects.reference[len] +
    state.rects.reference[axis] -
    popperOffsets[axis] -
    state.rects.popper[len];
  const startDiff = popperOffsets[axis] - state.rects.reference[axis];

  const arrowOffsetParent = getOffsetParent(arrowElement);
  const clientSize = arrowOffsetParent
    ? axis === 'y'
      ? arrowOffsetParent.clientHeight || 0
      : arrowOffsetParent.clientWidth || 0
    : 0;

  const centerToReference = endDiff / 2 - startDiff / 2;

  // Make sure the arrow doesn't overflow the popper if the center point is
  // outside of the popper bounds
  const min = paddingObject[minProp];
  const max = clientSize - arrowRect[len] - paddingObject[maxProp];
  const center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
  const offset = within(min, center, max);

  // Prevents breaking syntax highlighting...
  const axisProp: string = axis;
  state.modifiersData[name] = {
    [axisProp]: offset,
    centerOffset: offset - center,
  };
}

function effect({ state, options }:any) {
  let { element: arrowElement = '[data-popper-arrow]' } = options;

  if (arrowElement == null) {
    return;
  }

  // CSS selector
  if (typeof arrowElement === 'string') {
    arrowElement = state.elements.popper.querySelector(arrowElement);

    if (!arrowElement) {
      return;
    }
  } 

  if (!contains(state.elements.popper, arrowElement)) { 
    return;
  }

  state.elements.arrow = arrowElement;
}
 
export default ({
  name: 'arrow',
  enabled: true,
  phase: 'main',
  fn: arrow,
  effect,
  requires: ['popperOffsets'],
  requiresIfExists: ['preventOverflow'],
});