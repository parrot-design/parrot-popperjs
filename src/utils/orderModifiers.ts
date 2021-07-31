 
import { modifierPhases } from '../enums';

 
function order(modifiers:any):any {
  const map = new Map();
  const visited = new Set();
  const result:any = [];

  modifiers.forEach((modifier:any) => {
    map.set(modifier.name, modifier);
  });

  // On visiting object, check for its dependencies and visit them recursively
  function sort(modifier:any) {
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

  modifiers.forEach((modifier:any) => {
    if (!visited.has(modifier.name)) {
      // check for visited object
      sort(modifier);
    }
  });

  return result;
}

export default function orderModifiers(
  modifiers:any
){
  // order based on dependencies
  const orderedModifiers = order(modifiers);

  // order based on phase
  return modifierPhases.reduce((acc, phase) => {
    return acc.concat(
      orderedModifiers.filter((modifier:any) => modifier.phase === phase)
    );
  }, []);
}
