import { Placement } from '..';

//获取基本位置
export default function getBasePlacement(placement: Placement) {
    return (placement.split('-')[0]);
}

export const basePlacements = ['top', 'right', 'bottom', 'left'];

export const autoPlacement = ['auto'];

export const variationPlacements = basePlacements.reduce(
    (acc: any, placement: any) =>
        acc.concat([(`${placement}-start`), (`${placement}-end`)]),
    []
);

export const placements = [...basePlacements, ...autoPlacement].reduce(
    (
        acc: any,
        placement
    ) => acc.concat([
        placement,
        `${placement}-start`,
        `${placement}-end`
    ])
    , []
)