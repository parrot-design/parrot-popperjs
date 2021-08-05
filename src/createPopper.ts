
import { ICreatePopperOptions, ICreatePopperState } from '.';
import { isElement, listScrollParents, getCompositeRect,getOffsetParent,getLayoutRect } from '@parrotjs/dom-utils';
import mergeByName from './utils/mergeByName';
import orderModifiers from './utils/orderModifiers';
import areValidElements from './utils/areValidElements';

type PopperGeneratorArgs = {
    defaultModifiers?: any,
    defaultOptions?: any,
};

const DEFAULT_OPTIONS: ICreatePopperOptions = {
    placement: 'bottom',
    modifiers:[],
    strategy: 'absolute'
}

export function popperGenerator(generatorOptions: PopperGeneratorArgs = {}) {

    const {
        defaultModifiers = [],
        defaultOptions = DEFAULT_OPTIONS
    } = generatorOptions;

    return function createPopper(reference: any, popper: any, options = defaultOptions) { 

        let state: ICreatePopperState = {
            placement: 'bottom',
            elements: {
                reference,
                popper
            },
            options: { ...DEFAULT_OPTIONS, ...defaultOptions },
            attributes: {},
            modifiersData:{}
        }

        let effectCleanupFns: Array<() => void> = [];
        let isDestroyed = false;

        const instance = {
            state,
            setOptions(options: ICreatePopperOptions) {
            
                cleanupModifierEffects();

                state.options = {
                    ...defaultOptions,
                    ...state.options,
                    ...options,
                }; 

                state.scrollParents = {
                    reference: isElement(reference)
                        ? listScrollParents(reference)
                        : reference.contextElement
                            ? listScrollParents(reference.contextElement)
                            : [],
                    popper: listScrollParents(popper)
                } 
                //根据依赖项进行排序
                const orderedModifiers: any = orderModifiers(
                    mergeByName([...defaultModifiers, ...state.options.modifiers])
                ); 

                state.orderedModifiers = orderedModifiers.filter((m: any) => m.enabled);

                runModifierEffects();

                return instance.update();
            },
            update() {
                return new Promise((resolve) => {
                    instance.forceUpdate();
                    resolve(state);
                })
            },
            destroy(){
                cleanupModifierEffects();
                isDestroyed = true;
            },
            forceUpdate() {
                if (isDestroyed) {
                    return;
                }
                const { reference, popper } = state.elements;
                //如果reference和popper不是合法节点就不处理
                if (!areValidElements(reference, popper)) {
                    return
                }
                state.rects = {
                    reference: getCompositeRect(
                      reference,
                      getOffsetParent(popper),
                      state.options.strategy === 'fixed'
                    ),
                    popper: getLayoutRect(popper),
                };
                state.reset = false;
                state.placement = state.options.placement;

                state.orderedModifiers.forEach(
                    (modifier:any) =>
                      (state.modifiersData[modifier.name] = {
                        ...modifier.data,
                      })
                ); 
                for (let index = 0; index < state.orderedModifiers.length; index++) { 
                    if (state.reset === true) {
                      state.reset = false;
                      index = -1;
                      continue;
                    }
          
                    const { fn, options = {}, name } = state.orderedModifiers[index];
          
                    if (typeof fn === 'function') {
                      state = fn({ state, options, name, instance }) || state;
                    }
                  }
            }
        }

        instance.setOptions(options).then((state) => {
            if (!isDestroyed && options.onFirstUpdate) {
                options.onFirstUpdate(state);
            }
        })

        function runModifierEffects(){  
            state.orderedModifiers.forEach(({ name, options = {}, effect }:any) => {
                if (typeof effect === 'function') {
                  const cleanupFn = effect({ state, name, instance, options });
                  const noopFn = () => {};
                  effectCleanupFns.push(cleanupFn || noopFn);
                }
            });
        }

        function cleanupModifierEffects() {
            effectCleanupFns.forEach(fn => fn());
            effectCleanupFns = [];
        }

        return instance;
    }
}
