  
  import { getOffsetParent,getWindow,getDocumentElement,getComputedStyle } from '@parrotjs/dom-utils'; 
  import getBasePlacement from '../utils/getBasePlacement';
  import { round } from '../utils/math';
   
  
  const unsetSides = {
    top: 'auto',
    right: 'auto',
    bottom: 'auto',
    left: 'auto',
  };
  
  // Round the offsets to the nearest suitable subpixel based on the DPR.
  // Zooming can change the DPR, but it seems to report a value that will
  // cleanly divide the values into the appropriate subpixels.
  function roundOffsetsByDPR({ x, y }:any) {
    const win: Window = window;
    const dpr = win.devicePixelRatio || 1;
  
    return {
      x: round(round(x * dpr) / dpr) || 0,
      y: round(round(y * dpr) / dpr) || 0,
    };
  }
  
  export function mapToStyles({
    popper,
    popperRect,
    placement,
    offsets,
    position,
    gpuAcceleration,
    adaptive,
    roundOffsets,
  }:any) {
    let { x = 0, y = 0 } =
      roundOffsets === true
        ? roundOffsetsByDPR(offsets)
        : typeof roundOffsets === 'function'
        ? roundOffsets(offsets)
        : offsets;
  
    const hasX = offsets.hasOwnProperty('x');
    const hasY = offsets.hasOwnProperty('y');
  
    let sideX: string = 'left';
    let sideY: string = 'top';
  
    const win: Window = window;
  
    if (adaptive) {
      let offsetParent = getOffsetParent(popper);
      let heightProp = 'clientHeight';
      let widthProp = 'clientWidth';
  
      if (offsetParent === getWindow(popper)) {
        offsetParent = getDocumentElement(popper);
  
        if (getComputedStyle(offsetParent).position !== 'static') {
          heightProp = 'scrollHeight';
          widthProp = 'scrollWidth';
        }
      }
  
      // $FlowFixMe[incompatible-cast]: force type refinement, we compare offsetParent with window above, but Flow doesn't detect it
      offsetParent = offsetParent
  
      if (placement === top) {
        sideY = 'bottom';
        // $FlowFixMe[prop-missing]
        y -= offsetParent[heightProp] - popperRect.height;
        y *= gpuAcceleration ? 1 : -1;
      }
  
      if (placement === 'left') {
        sideX = 'right';
        // $FlowFixMe[prop-missing]
        x -= offsetParent[widthProp] - popperRect.width;
        x *= gpuAcceleration ? 1 : -1;
      }
    }
  
    const commonStyles = {
      position,
      ...(adaptive && unsetSides),
    };
  
    if (gpuAcceleration) {
      return {
        ...commonStyles,
        [sideY]: hasY ? '0' : '',
        [sideX]: hasX ? '0' : '',
        // Layer acceleration can disable subpixel rendering which causes slightly
        // blurry text on low PPI displays, so we want to use 2D transforms
        // instead
        transform:
          (win.devicePixelRatio || 1) < 2
            ? `translate(${x}px, ${y}px)`
            : `translate3d(${x}px, ${y}px, 0)`,
      };
    }
  
    return {
      ...commonStyles,
      [sideY]: hasY ? `${y}px` : '',
      [sideX]: hasX ? `${x}px` : '',
      transform: '',
    };
  }
  
  function computeStyles({ state, options }:any) { 
    const {
      gpuAcceleration = true,
      adaptive = true,
      // defaults to use builtin `roundOffsetsByDPR`
      roundOffsets = true,
    } = options;
 
    const commonStyles = {
      placement: getBasePlacement(state.placement),
      popper: state.elements.popper,
      popperRect: state.rects.popper,
      gpuAcceleration,
    };
  
    if (state.modifiersData.popperOffsets != null) {
      state.styles.popper = {
        ...state.styles.popper,
        ...mapToStyles({
          ...commonStyles,
          offsets: state.modifiersData.popperOffsets,
          position: state.options.strategy,
          adaptive,
          roundOffsets,
        }),
      };
    }
  
    if (state.modifiersData.arrow != null) {
      state.styles.arrow = {
        ...state.styles.arrow,
        ...mapToStyles({
          ...commonStyles,
          offsets: state.modifiersData.arrow,
          position: 'absolute',
          adaptive: false,
          roundOffsets,
        }),
      };
    }
  
    state.attributes.popper = {
      ...state.attributes.popper,
      'data-popper-placement': state.placement,
    };
  } 
  
  export default ({
    name: 'computeStyles',
    enabled: true,
    phase: 'beforeWrite',
    fn: computeStyles,
    data: {},
  });