import React ,{ useEffect } from 'react';
import { createPopper } from '../../src';
//import { createPopper } from '@popperjs/core';

export default function Demo() {

    const buttonRef=React.useRef(null);

    const tooltipRef=React.useRef(null);

    useEffect(() => {
        console.log("buttonRef",buttonRef.current)
        console.log("tooltipRef",tooltipRef.current)
        createPopper(buttonRef.current,tooltipRef.current,{
            placement:'bottom'
        })
    }, [])

    return (<div style={{paddingTop:200,paddingLeft:200}}>
        <button ref={buttonRef}>我只是一个按钮</button>
        <div ref={tooltipRef}>我只是一个tooltip</div>
    </div>)
}