 

const hash = { start: 'end', end: 'start' };

export default function getOppositeVariationPlacement(
  placement
) {
  return placement.replace(/start|end/g, matched => hash[matched]);
}
