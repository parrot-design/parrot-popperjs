import { Placement,Variation } from ".."

//获取第二位置
export default function getVariation(placement: Placement):Variation {
    return (placement.split('-')[1] as Variation);
}