# Popper.js源码解析

## Popper.js是什么？

Popper.js是一个专门用于定位元素的一个js库，在vue-popper、react-popper中均有使用，可以说是一个非常底层的库了。

## Popper.js功能

Popper.js可以实现正确的定位元素，不停的迭代处理了大量的边缘情况，如在滚动容器中、浏览器的兼容性和一些溢出以及裁剪的情况。

## Popper.js使用

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

[在线codesandbox运行链接](https://codesandbox.io/s/interesting-morning-xrzlhs?file=/src/App.js:0-581)，可以清楚的看到“我只是一个tooltip”div被成功的定位到了“我只是一个按钮”的这个按钮上的底部了。

