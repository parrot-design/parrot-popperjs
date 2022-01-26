import getDocument from './getDocument';

export default function isBodyHTML(dom:HTMLElement){
    return getDocument().body===dom
}