
export default function format(str, ...args) {
  return [...args].reduce((p, c) => p.replace(/%s/, c), str);
}
