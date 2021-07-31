import { Placement } from "..";

export default function getMainAxisFromPlacement(
    placement: any
): 'x' | 'y' {
    return ['top', 'bottom'].indexOf(placement) >= 0 ? 'x' : 'y';
}
  