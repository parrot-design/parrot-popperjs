import { modifierPhases } from '../enums';

function order(modifiers) {
    const map = new Map();
    const visited = new Set();
    const result = [];

    modifiers.forEach(modifier => {
        map.set(modifier.name, modifier)
    })

    function sort(modifier) {
        visited.add(modifier.name);

        const requires = [
            ...(modifier.requires || []),
            ...(modifier.requiresIfExists || []),
        ];

        requires.forEach(dep => {
            if (!visited.has(dep)) {
                const depModifier = map.get(dep);

                if (depModifier) {
                    sort(depModifier);
                }
            }
        });

        result.push(modifier);
    }

    modifiers.forEach(modifier => {
        if (!visited.has(modifier.name)) {
            sort(modifier);
        }
    });

    return result;
}

export default function orderModifiers(
    modifiers
) {
    //order based on dependencies
    const orderedModifiers = order(modifiers);

    return modifierPhases.reduce((acc, phase) => {
        return acc.concat(
          orderedModifiers.filter(modifier => modifier.phase === phase)
        );
      }, []);
}