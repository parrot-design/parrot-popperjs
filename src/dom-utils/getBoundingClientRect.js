import { isHTMLElement } from "./instanceof";
import { round } from '../util/math';

export default function getBoundingClientRect(
    element,
    includeScale=false
){
    const rect=element.getBoundingClientRect();
    let scaleX=1;
    let scaleY=1;

    if(isHTMLElement(element) && includeScale){
        const offsetHeight=element.offsetHeight;
        const offsetWidth=element.offsetWidth;

        if(offsetWidth>0){
            scaleX=round(rect.width)/offsetWidth||1;
        }
        if(offsetHeight>0){
            scaleY=round(rect.height)/offsetHeight||1;
        }
    }

    return {
        width:rect.width/scaleX,
        height:rect.height/scaleY,
        top:rect.top/scaleY,
        right:rect.right/scaleX,
        bottom:rect.bottom/scaleY,
        left:rect.left/scaleX,
        x:rect.left/scaleX,
        y:rect.top/scaleY
    }
}