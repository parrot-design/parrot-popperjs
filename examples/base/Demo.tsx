import React, { useState,useEffect } from 'react';
//import { createPopper } from '../../src';
import { createPopper } from '@popperjs/core';   

export default function Demo() {

    const buttonRef = React.useRef(null);

    const tooltipRef = React.useRef(null);

    useEffect(() => {
        createPopper(buttonRef.current, tooltipRef.current,{
            placement:'top'
        }); 
        
        console.log(buttonRef.current.getBoundingClientRect()) 
    }, []);

    const [_,forceUpdate]=useState({})
 

    return (
        <div style={{ 
            paddingTop: 200, 
            paddingLeft: 100,
            marginTop:100,
            marginLeft:100
         }}>
            <div style={{ paddingTop: 200, paddingLeft: 200,position:'absolute',width:100,height:100 }}>
                <button ref={buttonRef} style={{transform:`scale(0.5)`}} onClick={()=>forceUpdate({})} >我只是一个按钮</button>
                <div ref={tooltipRef}>
                    我只是一个tooltip
                </div>
                <div id="scroll" style={{width:200,height:200,background:'red'}}>scrolldemo</div>
            </div> 
        </div >
    )
}

const Demo2=()=>{
    useEffect(()=>{
        // console.log("demo2==")
    },[])
    return <div>demo2</div>
}