import React, { useEffect } from 'react';
//import { createPopper } from '../../src';
import { createPopper } from '@popperjs/core';

export default function Demo() {

    const buttonRef = React.useRef(null);

    const tooltipRef = React.useRef(null);

    useEffect(() => {
        createPopper(buttonRef.current, tooltipRef.current);
    }, []);

    return (
        <div style={{ paddingTop: 200, paddingLeft: 200,marginTop:100,position:'absolute' }}>
            <div style={{ paddingTop: 200, paddingLeft: 200 }}>
                <button ref={buttonRef}>我只是一个按钮</button>
                <div ref={tooltipRef} style={{whiteSpace:'nowrap'}} >
                我只是我只是我只是我只是我只是我只是我只我只是我只是我只是我只是我只是我只是我只
                </div>
            </div>
        </div >
    )
}