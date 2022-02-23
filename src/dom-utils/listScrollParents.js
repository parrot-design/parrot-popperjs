import getParentNode from './getParentNode';
import getScrollParent from './getScrollParent';
import getWindow from './getWindow';
import isScrollParent from './isScrollParent';

/**
 * 
 * @param {*} element 
 * @param {*} list 
 * @returns 
 * 给定一个DOM元素，返回所有滚动父元素的列表，向上返回祖先列表
    直到我们到达顶部窗口对象。这个列表是我们附加的滚动监听器
    ，因为如果这些父元素滚动，我们将需要重新计算
    引用元素的位置。
 */
export default function listScrollParents(
    element,
    list=[]
){
    const scrollParent=getScrollParent(element); 
    const isBody=scrollParent === element.ownerDocument?.body;
  
    const win=getWindow(scrollParent);
  
    const target=isBody
        ?[win].concat(win.visualViewport||[],isScrollParent(scrollParent)?scrollParent:[])
        :scrollParent;
      
    const updatedList=list.concat(target);
    return isBody
        ? updatedList
        : updatedList.concat(listScrollParents(getParentNode(target)));
}