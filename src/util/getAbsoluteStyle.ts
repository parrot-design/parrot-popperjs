//定位是否根据HTML元素 默认不是
export default function getAbsoluteStyle(referceRect: DOMRect, popperRect: DOMRect, parentRect?: DOMRect) {

    
  
    let {
        x: referceX,
        y: referceY,
        bottom: referceBottom,
        width: referceWidth
    } = referceRect;

    

    let {
        x: popperX,
        y: popperY,
        bottom: popperBottom,
        width: popperWidth
    } = popperRect;
    
    console.log("==popperWidth==",popperWidth)

    let {
        x: parentX,
        y: parentY,
        bottom: parentBottom,
        width: parentWidth,
        top:parentTop
    } = parentRect || { x: 0, y: 0, bottom: 0, width: 0,top:0 };

    const translateY = parentRect?referceBottom-parentTop:referceBottom;

    const translateX = parentRect?(referceX-parentX) + (referceWidth - popperWidth) / 2 : referceX + (referceWidth - popperWidth) / 2; 

    return `
        position:absolute;
        inset:0 auto auto 0;
        transform:translate(${translateX}px,${translateY}px)
    `
}