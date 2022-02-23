
export const top = 'top';
export const bottom = 'bottom';
export const right = 'right';
export const left = 'left';
export const auto = 'auto';

export const end='end';

export const basePlacements = [top, bottom, right, left];

export const variationPlacements = basePlacements.reduce(
    (acc, placement) =>
        acc.concat([`${placement}-${start}`, `${placement}-${end}`]),
    []
);

export const placements = [...basePlacements, auto].reduce((acc, placement) =>
    acc.concat([
        placement,
        `${placement}-${start}`,
        `${placement}-${end}`
    ]), []);

export const modifierPhases = [
    'beforeRead',
    'read',
    'afterRead',
    'beforeMain',
    'main',
    'afterMain',
    'beforeWrite',
    'write',
    'afterWrite'
];