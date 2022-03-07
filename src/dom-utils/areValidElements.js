export default function areValidElements(
    ...args
){
    return args.every(element=>(
        element && typeof element.getBoundingClientRect==='function'
    ))
}