const hash:any = { start: 'end', end: 'start' };

export default function getOppositeVariationPlacement(
  placement:any
) {
  return (placement.replace(/start|end/g, (matched:any) => hash[matched]));
}