Popper.js源码解析

# Popper.js是什么？

Popper.js是一个专门用于定位元素的一个js库，在vue-popper、react-popper中均有使用，可以说是一个非常底层的库了。

# Popper.js功能

Popper.js可以实现正确的定位元素，不停的迭代处理了大量的边缘情况，如在滚动容器中、浏览器的兼容性和一些溢出以及裁剪的情况等。

# Popper.js使用

```js
//react版本
import React, { useEffect } from "react";
import { createPopper } from "@popperjs/core";

export default function Demo() {
  const buttonRef = React.useRef(null);

  const tooltipRef = React.useRef(null);

  useEffect(() => {
    createPopper(buttonRef.current, tooltipRef.current);
  }, []);

  return (
    <div
      style={{
        paddingTop: 100,
        paddingLeft: 100
      }}
    >
      <div style={{ paddingTop: 100, paddingLeft: 100 }}>
        <button ref={buttonRef}>我只是一个按钮</button>
        <div ref={tooltipRef}>我只是一个tooltip</div>
      </div>
    </div>
  );
} 
```

>[在线codesandbox运行链接](https://codesandbox.io/s/interesting-morning-xrzlhs?file=/src/App.js:0-581)，可以清楚的看到“我只是一个tooltip”div被成功的定位到了“我只是一个按钮”的这个按钮上的底部了。我们可以看到这个div除了absolute、left、right等定位相关的css外并没有添加额外的样式，它的作用也只有一个，那就是定位元素。

>本文使用不做过多介绍，具体可以查看他的[官网](https://popper.js.org/)

# Popper.js源码解析

从[github](https://github.com/floating-ui/floating-ui/tree/v2.x)上拉取相应代码。

从目录上我们就可以看出核心源码都在src下面，由于popper.js采用的是flow工具进行静态编译检查，所以使用vs code打开会有很多错误，我们可以尝试着将flow相关的代码进行删除，以方便我们查看。

## 1.入口文件

我们看到index.js这很明显就是他的入口文件，我们通过上面的例子可以知道到出的createPopper是核心，所以我们只关注导出createPopper的这一行就可以了。

```js
export { createPopper } from './popper';
```

## 2.次入口文件

我们再看到popper.js文件，这里我暂且称之为次入口文件，只关心createPopper部分，如下

```js
import { popperGenerator } from './createPopper'
//这里为装饰器的集合 装饰器的作用是计算位置、设置样式等这里我们后期会讲到
const defaultModifiers=[
  ...
];
const createPopper=popperGenerator({defaultModifiers})
export { createPopper };
```

## 3.createPopper.js文件

兜兜转转还是来到了createPopper.js文件，我们找到popperGenerator函数

先看此文件中用到的几个工具函数

```js

const INVALID_ELEMENT_ERROR='Popper:Invalid reference or popper argument provided.They must be either a DOM element or virtual element.';
const INFINITE_LOOP_ERROR =
  'Popper: An infinite loop in the modifiers cycle has been detected! The cycle has been interrupted to prevent a browser crash.';


const DEFAULT_OPTIONS={
  //定位元素默认位置为bottom,即底部
  placement:'bottom',
  //插件为空
  modifiers:[],
  //定位策略默认为absolute
  strategy:'absolute'
}

export function popperGenerator(generatorOptions={}){
  	const {
      defaultModifiers=[],
      defaultOptions=DEFAULT_OPTIONS
    }=generatorOptions;
    
    return function createPopper(
    		reference,
       	popper,
        options=defaultOptions
    ){
      //全局state状态
      let state={
        //默认为底部
        placement:'bottom',
        //默认可以自定义扩展，所以需要进行排序
        orderedModifiers:[],
        //可选项
        options:{...DEFAULT_OPTIONS,...defaultOptions},
        //通过modifiers计算出来的数据等，存储起来方便后续使用
        modifiersData:{},
        //存储定位以及被定位元素
        elements:{
          reference,
          popper
        },
        //存储属性
        attributes:{},
        //存储样式
        styles:{}
      };
      
      //存储一些副作用函数，便于以后清除，如后续我们会讲到的监听以及移除监听
      let effectCleanupFns=[];
      //定义popper实例是否已经销毁
      let isDestroyed=false;
      
      //popper实例 此函数返回此实例
      const instance={
        state,
        //在低评率下使用forceUpdate 但是经过我测试并无实质性差别
        forceUpdate(){
          if(isDestroyed){
            return ;
          }
          const {reference,popper}=state.elements;
          //如果有一个不是元素 直接返回 不进行任何操作
          if(!areValidElements(reference,popper)){
            if(__DEV__){
              console.error(INVALID_ELEMENT_ERROR);
              return ;
            }
          }
          
          //存储popper和reference 相比较于offsetaParent的rect 以便于modifier进行读取
          state.rects={
            reference:getCompositeRect(
            	reference,
              getOffsetParent(popper),
              state.options.strategy==='fixed'
            ),
            popper:getLayoutRect(popper)
          }
          
          //**
          state.reset=false;
          //记录位置
          state.placement = state.options.placement;
          //记录更新值
          state.orderedModifiers.forEach(
            (modifier) =>
              (state.modifiersData[modifier.name] = {
                ...modifier.data,
              })
          );
          let __debug_loops__ = 0;
          for (let index = 0; index < state.orderedModifiers.length; index++) {
            if (__DEV__) {
              __debug_loops__ += 1;
              //调用次数过多会导致异常 给予提示
              if (__debug_loops__ > 100) {
                console.error(INFINITE_LOOP_ERROR);
                break;
              }
            }
            if (state.reset === true) {
            	state.reset = false;
	            index = -1;
  	          continue;
    	      }
            //获取对应的属性
            const { fn, options = {}, name } = state.orderedModifiers[index];
            if(typeof fn==='function'){
              //核心代码 在此执行对应的modifier函数
              state=fn({state,options,name,instance}) || state;
            }
          }
        },
        //更新方法 主要用于设置元素最新定位 官方声明在高频率方法中使用update 如scroll 
        update:debounce(
        	()=>new Promise((resolve)=>{
            //在低频率下使用forceUpdate 
            instance.forceUpdate();
            resolve(state);
          })
        ),
        setOptions(setOptionsAction){
          const options=typeof setOptionsAction==='function'
          	?setOptionsAction(state.options)
          	:setOptionsAction;
          
          //每次初始化popper实例时，清除一些副作用函数
          cleanupModifierEffects();
          //设置state所有的options
          state.options={
            ...defaultOptions,
            ...state.options,
            ...options
          };
          //获取父祖先们的滚动dom 便于后期添加事件监听等
          state.scrollParents={
            reference:isElement(reference)
            	?listScrollParents(reference)
            	:reference.contextElement
            	?listScrollParents(reference.contextElement)
            	:[],
            popper: listScrollParents(popper),
          };
          //根据他们的依赖项和phase进行排序
          const orderedModifiers=orderModifiers(
            //通过名字合并modifiers
            mergeByName([...defaultModifiers,...state.options.modifiers])
          );
          //剔除禁用的modifier
          state.orderedModifiers=orderedModifiers.filter(m=>m.enabled);
          if(__DEV__){
            //去除重复name的modifier 这里不是很理解 因为上面已经去过一次重了
            const modifiers=uniqueBy(
            	[...orderedModifiers,...state.options.modifiers],
              ({name})=>name
            );
            //验证modifiers属性合法性
            validateModifiers(modifiers);
            
            if(getBasePlacement(state.options.placement)===auto){
              const flipModifier=state.orderModiflers.find(
              	({name})=>name==='flip'
              );
              //如果是auto定位 filp modifier是必须的
              if (!flipModifier) {
                console.error(
                  [
                    'Popper: "auto" placements require the "flip" modifier be',
                    'present and enabled to work.',
                  ].join(' ')
                );
              }
            }
            
            const {
              marginLeft,
              marginRight,
              marginBottom,
              marginLeft
            }=getComputedStyle(popper);
            //我们不再考虑popper的margin 因为可能会对定位产生影响
            if (
              [marginTop, marginRight, marginBottom, marginLeft].some((margin) =>
                parseFloat(margin)
              )
            ) {
              console.warn(
                [
                  'Popper: CSS "margin" styles cannot be used to apply padding',
                  'between the popper and its reference element or boundary.',
                  'To replicate margin, use the `offset` modifier, as well as',
                  'the `padding` option in the `preventOverflow` and `flip`',
                  'modifiers.',
                ].join(' ')
              );
          	}
            runModifierEffects();
            
            return instance.update();
          }
        }
      };
      
      if(!areValidElements(reference,popper)){
        //开发模式下如果不是节点 直接会报错 不会设置定位的一些方法
        if(__DEV__){
          console.error(INVALID_ELEMENT_ERROR);
        }
        return instance;
      }
      
      instance.setOptions(options).then((state)=>{
        //更新完执行onFistUpdate
        if(!isDestroyed && options.onFirstUpdate){
          options.onFirstUpdate(state);
        }
      })
      //执行副作用代码并向effectCleanupFns数组中添加cleanup方法
      function runModifierEffects(){ 
        state.orderedModifiers.forEach((name,options={},effect)=>{
          if(typeof effect==='function'){
            const cleanupFn=effect({state,name,instance,options});
          }
        })
      }
      //执行clean方法
      function cleanupModifierEffects(){
        effectCleanupFns.forEach(fn=>fn());
        effectCleanupFns=[];
      }
      //返回实例
      return instance;
    }
}
```

## 4.modifiers

> 其实这个库的核心就是modifiers 每个modifier相当于一个插件一样 可以随意拔插 可以任意扩展 所有计算位置都是由modifier进行计算的

### 1.phase

> 相当于popperjs中的生命周期 popperjs中一共有9个阶段  依次为beforeRead=>read=>afterRead=>beforeMain=>main=>afterMain=>beforeWrite=>afterWrite=>afterWrite 

由英文可以看出来是读->纯计算->最后再赋值

### 2.modifier执行的顺序

> 根据phase阶段和require可以得出modifier的执行顺序分别为popperOffsets=>offset=>flip=>preventOverflow=>arrow=>hide=>computeStyles=>eventListeners=>applyStyles

### 3.popperOffsets

> 计算popper的offset偏移量

```js
function popperOffsets({state,name}){
  
}

export default {
  name:'popperOffsets',
  enabled:true,
  phase:'read',
  fn:popperOffsets,
  data:{}
}
```





# Popper.js的一些工具函数

## 1.dom相关的方法

1. getWindow

   > 获取window暂时不知道这么写明确的用途 可能用于iframe某些兼容场景

   ```js
   function getWindow(node){
     if(node==null){
       return window;
     }
     if(node.toString()!=='[object Window]'){
       const ownerDocument=node.ownerDocument;
       return ownerDocument?ownerDocument.defaultView||window:window;
     }
     return node;
   }
   ```

2. getBoundingClientRect获取元素方法

   >获取rect方法，考虑了缩放的情况，默认不考虑，和原生getBoundingClientRect一致

   ```js
   function getBoundClientRect(
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
         width:rect.width/scaleY,
         height:rect.height/scaleY,
         top:rect.top/scaleY,
         right:rect.right/scaleX,
         bottom:rect.bottom/scaleY,
         left:rect.left/scaleX,
         x:rect.left/scaleX,
         y:rect.top/scaleY
       }
   }
   ```

3. isHTMLElement

   > 判断是否是HTML元素,如body div span标签等

   ```js
   function isHTMLElement(node){
     const OwnElement=getWindow(node).HTMLElement;
     return node instanceof OwnElement || node instanceof HTMLElement;
   }
   ```

4. getLayoutRect

   > 获取元素相对于offsetParent的矩形数据信息，x,y,width,height

   ```js
   function getLayoutRect(element){
     const clientRect=getBoundingClientRect(element);
     
     let width=element.offsetWidth;
     let height=element.offsetHeight;
     //做了某种兼容 这里暂时无从得知
     if(Math.abs(clientRect.width-width)<=1){
       width=clientRect.width;
     }
     //做了某种兼容 这里暂时无从得知
     if(Math.abs(clientRect.height-height)<=1){
       height=clientRect.height;
     }
     return {
       x:element.offsetLeft,
       y:element.offsetTop,
      	width,
       height
     }
   }
   ```

5. getContainingBlock

   > 返回元素的包含块 [什么是包含块](https://blog.csdn.net/hangxingkong/article/details/54894642) 
   >
   > 1. 如果元素是relative或者static 包含块为最近的祖先元素
   >
   > 2. 如果元素是absolute 包含块为最近的不是static的祖先元素
   >
   > 3. 如果元素是fixed 则包含块为视口建立
   >
   > 4. 如果是absolute或者fixed 包含块也可以由最近的含有一些属性组成
   >
   >    但是他的这个函数将1、2情况都忽略了 改成了null 即除了4以外 返回都是null

   ```js
   function getContainingBlock(element){
     //火狐
     const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
     //IE
     const isIE = navigator.userAgent.indexOf('Trident') !== -1;
     if(isIE && isHTMLElement(element)){
       //在ie 9/10/11中固定元素的包含块均由视口组成
       const elementCss=getComputedStyle(element);
       if(elementCss.position==='fixed'){
         return null;
       }
     }
     let currentNode=getParentNode(element);
     if(isShadowRoot(currentNode)){
       currentNode=currentNode.host;
     }
     while(
     	isHTMLElement(currentNode) && ['html','body'].indexOf(getNodeName(currentNode))<0
     ){
       const css=getComputedStyle(currentNode);
        if (
         css.transform !== 'none' || if (
         css.transform !== 'none' ||
         css.perspective !== 'none' ||
         css.contain === 'paint' ||
         ['transform', 'perspective'].indexOf(css.willChange) !== -1 ||
         (isFirefox && css.willChange === 'filter') ||
         (isFirefox && css.filter && css.filter !== 'none')
       ) {
         return currentNode;
       } else {
         currentNode = currentNode.parentNode;
       } 
     }
     return null;
   }
   ```

6. getComputedStyle

   > getComputedStyle的简单封装

   ```js
   function getComputedStyle(
   	element	
   ){
       return getWindow(element).getComputedStyle(element);
   }
   ```

7. getNodeName

   > 获取nodeName 并进行小写转换

   ```js
   function getNodeName(){
     return element ? (element.nodeName||'').toLowerCase():null;
   }
   ```

8. isElement

    > 判断是否是Element元素 HTMLElement是Element元素的子集，[HTMLElement和Element的区别](https://www.itranslater.com/qa/details/2583770415382397952)

    ```js
    function isElement(node) {
      const OwnElement = getWindow(node).Element;
      return node instanceof OwnElement || node instanceof Element;
    } 
    ```

9. getDocumentElement

    > ownerDocument获取返回当前节点的顶层的 document 对象。documentElement 是一个会返回文档对象（[`document`](https://developer.mozilla.org/zh-CN/docs/Web/API/Document)）的根[`元素`](https://developer.mozilla.org/zh-CN/docs/Web/API/Element)的只读属性（如HTML文档的 [``](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/html) 元素）。所以这个函数的作用就是返回当前的html根元素。

    ```js
    function getDocumentElement(
    	element
    ){
    	return (
        (isElement(element)
          ? element.ownerDocument
          : element.document) || window.document
      ).documentElement;    
    }
    ```

10. isShadowRoot

    > 是否是shadowRoot元素 [什么是shadowRoot](https://developer.mozilla.org/zh-CN/docs/Web/API/ShadowRoot)

    ```js
    function isShadowRoot(node) {
      // IE 11 has no ShadowRoot
      if (typeof ShadowRoot === 'undefined') {
        return false;
      }
      const OwnElement = getWindow(node).ShadowRoot;
      return node instanceof OwnElement || node instanceof ShadowRoot;
    }
    ```

11. getParentNode

    > 顾名思义 是获取节点的父节点的 如果没有 则为html文档

    ```js
    function getParentNode(
    	element
    ){
    	if(getNodeName(element)==='html'){
        return element;
      }
       return (
        // this is a quicker (but less type safe) way to save quite some bytes from the bundle 
        element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
        element.parentNode || // DOM Element detected
        (isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
        // $FlowFixMe[incompatible-call]: HTMLElement is a Node
        getDocumentElement(element) // fallback
      );
    }
    ```

12. getTrueOffsetParent

    > 获取元素的offsetParent [什么是offsetParent](https://blog.csdn.net/u012532033/article/details/72851692)

    ```js
    function getTrueOffsetParent(element){
      if(!isHTMLElement(element)||getComputedStyle(element).position==='fixed'){
        return null;
      }
      return element.offsetParent;
    }
    ```

13. getOffsetParent

    > 获取offsetParent

    ```js
    //获取最近的祖先定位元素。处理一些边缘情况，
    //比如表的祖先和跨浏览器的bug。
    function getOffsetParent(element){
      const window=getWindow(element);
      
      let offsetParent=getTrueOffsetParent(element);
      
       while (
        offsetParent &&
        isTableElement(offsetParent) &&
        getComputedStyle(offsetParent).position === 'static'
      ) {
        offsetParent = getTrueOffsetParent(offsetParent);
      }
        if (
        offsetParent &&
        (getNodeName(offsetParent) === 'html' ||
          (getNodeName(offsetParent) === 'body' &&
            getComputedStyle(offsetParent).position === 'static'))
      ) {
        return window;
      }
      return offsetParent || getContainingBlock(element) || window;
    }
    ```

14. isTableElement

      > 判断是否是table元素

      ```js
      function isTableElement(element) {
        return ['table', 'td', 'th'].indexOf(getNodeName(element)) >= 0;
      }
      ```

15. isElementScaled

    > 因为offsetWidth不受缩放的影响 但是rect会受缩放的影响 所以可以借此来判断元素是否有被缩放

    ```js
    function isElementScaled(element) {
      const rect = element.getBoundingClientRect();
      const scaleX = round(rect.width) / element.offsetWidth || 1;
      const scaleY = round(rect.height) / element.offsetHeight || 1;
    
      return scaleX !== 1 || scaleY !== 1;
    }
    ```

16. getWindowScroll

    > 获取窗口滚动距离  pageXOffset 和 pageYOffset 属性返回文档在窗口左上角水平和垂直方向滚动的像素

    ```js
    function getWindowScroll(node) {
      const win = getWindow(node);
      const scrollLeft = win.pageXOffset;
      const scrollTop = win.pageYOffset;
    
      return {
        scrollLeft,
        scrollTop,
      };
    }
    ```

17. getHTMLElementScroll

    > 获取元素内部滚动距离  scrollLeft/scrollTop设置或返回元素内容向左滚动/向上滚动(水平方向/垂直方向)的像素数。

    ```js
    function getHTMLElementScroll(element){
      return {
        scrollLeft:element.scrollLeft,
        scrollTop:element.scrollTop
      }
    }
    ```

18. getNodeScroll

    > 兼容dom和window的滚动距离

    ```js
    function getNodeScroll(node) {
      if (node === getWindow(node) || !isHTMLElement(node)) {
        return getWindowScroll(node);
      } else {
        return getHTMLElementScroll(node);
      }
    } 
    ```

19.  isScrollParent

    > 检查元素是否是滚动元素

    ```js
    function isScrollParent(element) { 
      const { overflow, overflowX, overflowY } = getComputedStyle(element);
      return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
    }
    ```

20. getWindowScrollBarX

    > 获取横向滚动条的长度

    ```js
    function getWindowScrollBarX(){
      return (
        getBoundingClientRect(getDocumentElement(element)).left +
        getWindowScroll(element).scrollLeft
      );
    }
    ```

21. getCompositeRect

     > 根据定位策略和offsetParent（fixed/absolute）获取rect

     ```js
     function getCompositeRect(
       elementOrVirtualElement,
       offsetParent,
       isFixed = false
     ) {
         //offsetParent是否是一个htmlelement
         const isOffsetParentAnElement = isHTMLElement(offsetParent);
         //offsetParent是否存在缩放
         const offsetParentIsScaled =
         isHTMLElement(offsetParent) && isElementScaled(offsetParent);
         //获取document的文档
         const documentElement = getDocumentElement(offsetParent);
         //获取rect
         const rect = getBoundingClientRect(
         	elementOrVirtualElement,
     	    offsetParentIsScaled
       	);
         let scroll = { scrollLeft: 0, scrollTop: 0 };
         let offsets = { x: 0, y: 0 };
         if (isOffsetParentAnElement || (!isOffsetParentAnElement && !isFixed)) {
            if (
     			      getNodeName(offsetParent) !== 'body' ||
           			// https://github.com/popperjs/popper-core/issues/1078
     			      isScrollParent(documentElement)
     		   ){
     	      	scroll = getNodeScroll(offsetParent);
     		   }
           //如果是元素获取rect加上边框高度宽度
           if (isHTMLElement(offsetParent)) {
     	      offsets = getBoundingClientRect(offsetParent, true);
       	    offsets.x += offsetParent.clientLeft;
         	  offsets.y += offsetParent.clientTop;
     	    } else if (documentElement) {
             //如果是html x加上滚动的距离
       	    offsets.x = getWindowScrollBarX(documentElement);
      		  }
         }
         return {
           //offsets表示offsetParent的偏移量
           x: rect.left + scroll.scrollLeft - offsets.x,
     	    y: rect.top + scroll.scrollTop - offsets.y,
       	  width: rect.width,
         	height: rect.height,
         }
     }
     ```

22. getScrollParent

    > 获取滚动的父元素

    ```js
    function getScrollParent(node){
      if(['html','body','#document'].indexOf(getNodeName(node))>=0){
        return node.ownerDocument.body;
      }
      
      if(isHTMLElement(node) && isScrollParent(node)){
        return node;
      }
      
      return getScrollParent(getParentNode(node));
    }
    ```

23. listScrollParents

    >给定一个DOM元素，返回所有滚动父元素的列表，向上返回祖先列表
    >直到我们到达顶部窗口对象。这个列表是我们附加的滚动监听器
    >，因为如果这些父元素滚动，我们将需要重新计算
    >引用元素的位置。

    ```js
    function listScrollParents(
    		element,
       	list=[]
    ){
    			const scrollParent = getScrollParent(element);
    	  	const isBody = scrollParent === element.ownerDocument?.body;
          const win=getWindow(scrollParent);
          const target=isBody
          	?[win].concat(
          		win.visualViewport||[],
    	        isScrollParent(scrollParent) ? scrollParent : []
          	)
          	:scrollParent;
          const updatedList = list.concat(target);
          return isBody
    	  	  ? updatedList
      	  	: updatedList.concat(listScrollParents(getParentNode(target)));
          
    }
    ```

    ## 2.普通工具函数方法

    1. orderModifiers

       > 根据requires、requiresIfExist、phase进行排序

       ```js
       function order(modifiers){
         const map=new Map();
         //记录访问过的modifier
         const visited=new Set();
         const result=[];
         //将modifier 名字和值作为key/value存起来
         modifiers.forEach(modifier=>{
           map.set(modifier.name,modifier)
         })
         //通过递归的方式将require放到当前modifier的前面
         function sort(modifier){
         	visited.add(modifier.name);
           
           const requires=[
             ...(modifier.requires||[]),
             ...(modifier.requiresIfExists||[])
           ]
           
           requires.forEach(dep=>{
             if(!visited.has(dep)){
               const depModifier=map.get(dep);
               
               if(depModifier){
                 sort(depModifier);
               }
             }
           });
           result.push(modifier);
         }
         
         modifiers.forEach(modifier=>{
           //如果没有访问过进行sort排序
           if(!visited.has(modifier.name)){
             sort(modifier);
           };
         });
         return result;
       }
       ```

    2. mergeByName

       > 根据modifiers的name合并modifier 假设存在name一样的modifier 这将会很有用

       ```js
       function mergeByName(
       	modifiers
       ){
         const merged=modifiers.reduce((merged,current)=>{
           const existing=merged[current.name];
           merged[current.name]=existing
           	?{
             	...existing,
             	...current,
               options:{...existing.options,...current.options},
       	      data:{...existing.data,...current.data}
            	}:current;
           	return merged;
         },{});
         //IE不支持Object.value 兼容写法
         return Object.keys(merged).map(key=>merged[key]);
       }
       ```

    3. areValidElements

       > 元素上有getBoundingClientRect为function表示该元素为dom元素，some表示存在有一个不是dom元素，前面加个！符号则代表没有一个不是dom元素，即函数参数都为dom元素

       ```js
        function areValidElements(...args){
            return !args.some(
            	element=>!(element && typeof element.getBoundingClientRect==='function')
            )
        }
       ```
       
    4. debounce防抖函数
    
       > 进行同步任务的防抖操作
    
       ```js
       function debounce(fn){
         let pending;
         return () => {
           if (!pending) {
             pending = new Promise(resolve => {
               Promise.resolve().then(() => {
                 pending = undefined;
                 resolve(fn());
               });
             });
           } 
           return pending;
         };
       }
       ```
    
    5. uniqueBy
    
       > 去除重复名字的modifier
    
       ```js
       function uniqueBy(arr, fn){
         const identifiers = new Set();
       
         return arr.filter(item => {
           const identifier = fn(item);
       
           if (!identifiers.has(identifier)) {
             identifiers.add(identifier);
             return true;
           }
         });
       }
       ```
    
    6. validateModifiers
    
       > 验证modifier的类型是否合法 并且是否有非法属性
    
       ```js
       //用于替换字符串里面的指定字符
       function format(str, ...args) {
         return [...args].reduce((p, c) => p.replace(/%s/, c), str);
       } 
       
       const INVALID_MODIFIER_ERROR =
         'Popper: modifier "%s" provided an invalid %s property, expected %s but got %s';
       const MISSING_DEPENDENCY_ERROR =
         'Popper: modifier "%s" requires "%s", but "%s" modifier is not available';
       const VALID_PROPERTIES = [
         'name',
         'enabled',
         'phase',
         'fn',
         'effect',
         'requires',
         'options',
       ];
       
       function validateModifiers(modifiers){
         modifiers.forEach(modifier=>{
            [...Object.keys(modifier), ...VALID_PROPERTIES]
           	//去重 去除重复元素
           	.filter((value,index,self)=>self.indexOf(value)===index)
           	.forEach((key)=>{
              switch(key){
                case 'name':
                  if(typeof modifier.name!=='string'){
                    console.error(
                    	format(
                     	INVALID_MODIFIER_ERROR,
                        String(modifier.name),
                        '"name"',
                        '"string"',
                        `"${String(modifier.name)}"`
                     )
                    );
                  }
                  break;
                case 'enabled':
                  if(typeof modifier.enabled!=='boolean'){
                    console.error(
                    	format(
                     	 INVALID_MODIFIER_ERROR,
                         modifier.name,
                         '"enabled"',
                         '"boolean"',
                         `"${String(modifier.enabled)}"`
                     )
                    )
                  }
                  break;
                case 'phase':
                   if (modifierPhases.indexOf(modifier.phase) < 0) {
                     console.error(
                       format(
                         INVALID_MODIFIER_ERROR,
                         modifier.name,
                         '"phase"',
                         `either ${modifierPhases.join(', ')}`,
                         `"${String(modifier.phase)}"`
                       )
                     );
                   }
                   break;
                 case 'fn':
                   if (typeof modifier.fn !== 'function') {
                     console.error(
                       format(
                         INVALID_MODIFIER_ERROR,
                         modifier.name,
                         '"fn"',
                         '"function"',
                         `"${String(modifier.fn)}"`
                       )
                     );
                   }
                   break;
                 case 'effect':
                   if (
                     modifier.effect != null &&
                     typeof modifier.effect !== 'function'
                   ) {
                     console.error(
                       format(
                         INVALID_MODIFIER_ERROR,
                         modifier.name,
                         '"effect"',
                         '"function"',
                         `"${String(modifier.fn)}"`
                       )
                     );
                   }
                   break;
                 case 'requires':
                   if (
                     modifier.requires != null &&
                     !Array.isArray(modifier.requires)
                   ) {
                     console.error(
                       format(
                         INVALID_MODIFIER_ERROR,
                         modifier.name,
                         '"requires"',
                         '"array"',
                         `"${String(modifier.requires)}"`
                       )
                     );
                   }
                   break;
                 case 'requiresIfExists':
                   if (!Array.isArray(modifier.requiresIfExists)) {
                     console.error(
                       format(
                         INVALID_MODIFIER_ERROR,
                         modifier.name,
                         '"requiresIfExists"',
                         '"array"',
                         `"${String(modifier.requiresIfExists)}"`
                       )
                     );
                   }
                   break;
                 case 'options':
                 case 'data':
                   break;
                default:
                   console.error(
                     `PopperJS: an invalid property has been provided to the "${
                       modifier.name
                     }" modifier, valid properties are ${VALID_PROPERTIES.map(
                       (s) => `"${s}"`
                     ).join(', ')}; but "${key}" was provided.`
                   );
              }
               modifier.requires &&
                 modifier.requires.forEach((requirement) => {
                   if (modifiers.find((mod) => mod.name === requirement) == null) {
                     console.error(
                       format(
                         MISSING_DEPENDENCY_ERROR,
                         String(modifier.name),
                         requirement,
                         requirement
                       )
                     );
                   }
                 });
            })
         })
       }
       ```
    
    7. getBasePlacement
    
       > 获取基础定位 'left-start'=>left.    'right-start'=>right
    
       ```js
       function getBasePlacement(placement){
         return placement.split('-')[0];
       }
       ```
    
       
