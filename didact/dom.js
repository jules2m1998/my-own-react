import {TEXT_ELEMENT} from "./consts";

export function createDom(fiber) {
    const dom =
        fiber.type === TEXT_ELEMENT
            ? document.createTextNode(fiber.props.nodeValue)
            : document.createElement(fiber.type);

    Object.keys(fiber.props).forEach(name => {
        if (name !== "children") {
            dom[name] = fiber.props[name];
        }
    })
    return dom;
}

const isEvent = k => k.toLowerCase().startsWith("on");
const isProperty = k => k !== "children"
const eventName = k => k.toLowerCase().substring(2)

export function updateDom(dom, prevProps, nextProps) {
    // Supprime les anciene proprietes
    Object
        .keys(prevProps)
        .filter(isProperty)
        .forEach(name => {
            if (!(name in nextProps)){
                if (!isEvent(name)){
                    dom[name] = "";
                } else {
                    dom.removeEventListener(eventName(name), prevProps[name])
                }
            }
        })

    // Ajout des nouvelles props
    Object
        .keys(prevProps)
        .filter(isProperty)
        .forEach(name => {
            if (prevProps[name] !== nextProps[name]){
                if (!isEvent(name)){
                    dom[name] = nextProps[name];
                }else {
                    if (prevProps[name]){
                        dom.removeEventListener(eventName(name), prevProps[name])
                    }
                    dom.addEventListener(eventName(name), nextProps[name])
                }
            }
        })
}