export default function expandToHashMap(value:any, keys:any) {
  return keys.reduce((hashMap:any, key:any) => {
    hashMap[key] = value;
    return hashMap;
  }, {});
}