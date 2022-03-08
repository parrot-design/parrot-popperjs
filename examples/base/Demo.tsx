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