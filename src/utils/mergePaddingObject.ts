 
import getFreshSideObject from './getFreshSideObject';

export default function mergePaddingObject(
  paddingObject:any
) {
  return {
    ...getFreshSideObject(),
    ...paddingObject,
  };
}