

const hash:any = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' };

export default function getOppositePlacement(placement:any) {
    return (placement.replace(
        /left|right|bottom|top/g,
        (matched:any) => hash[matched]
    ));
}