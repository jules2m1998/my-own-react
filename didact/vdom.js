import {TEXT_ELEMENT} from "./consts";

/**
 *
 * @param type {string} type Type de l'element a ajouter
 * @param props {object} props
 * @param children {...object|string} children
 */
export function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => (typeof child === "object" ? child : createTextElement(child)))
        }
    }
}

/**
 *
 * @param text {string}
 * @returns {{type: string, props: {nodeValue, children: *[]}}}
 */
function createTextElement(text) {
    return {
        type: TEXT_ELEMENT,
        props: {
            nodeValue: text,
            children: []
        }
    }
}