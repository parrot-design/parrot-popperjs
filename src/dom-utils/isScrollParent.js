import getComputedStyle from './getComputedStyle';

export default function isScrollParent(element){
    const {overflow,overflowX,overflowY}=getComputedStyle(element); 
    return /auto|scroll|overlay|hidden/.test(overflow+overflowY+overflowX);
}