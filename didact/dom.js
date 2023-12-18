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