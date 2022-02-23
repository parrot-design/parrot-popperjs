import getWindow from "./getWindow";
import { isHTMLElement } from "./instanceof";
import getWindowScroll from './getWindowScroll';
import getHTMLElementScroll from "./getHTMLElementScroll";

export default function getNodeScroll(
    node
){
    if(node===getWindow(node)||!isHTMLElement(node)){
        return getWindowScroll(node);
    }else{
        return getHTMLElementScroll(node);
    }
}