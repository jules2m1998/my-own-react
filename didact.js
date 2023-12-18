import {createElement} from "./didact/vdom";
import {createDom} from "./didact/dom";


let nextUnitOfWork = null;
let wipRoot = null;

/**
 *
 * @param {object} element
 * @param {HTMLElement} container
 */
function render(element, container){
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        }
    }
    nextUnitOfWork = wipRoot;
}

function commitWork(fiber) {
    console.log(fiber)
    if(!fiber) return;
    const domParent = fiber.parent.dom;
    domParent.appendChild(fiber.dom);
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function commitRoot() {
    commitWork(wipRoot.child);
    wipRoot = null;
}

/**
 *
 * @param {IdleDeadline} deadline
 */
function workLoop(deadline){
    let shouldYield = deadline.timeRemaining() < 1;
    while (nextUnitOfWork && !shouldYield){
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }
    if (!nextUnitOfWork && wipRoot){
        commitRoot();
    }
    requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop)

/**
 *
 * @param {object} fiber
 * @returns {object|null}
 */
function performUnitOfWork(fiber) {
    if(!fiber.dom){
        fiber.dom = createDom(fiber);
    }
    if (fiber.parent){
        fiber.parent.dom.appendChild(fiber.dom);
    }
    const elements = fiber.props.children;
    let index = 0;
    let prevSibling = null;
    while (index < elements.length){
        const element = elements[index];
        const newFiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null
        }
        if (index === 0){
            fiber.child = newFiber;
        }else {
            prevSibling.sibling = newFiber
        }
        prevSibling = newFiber;
        index++;
    }
    if (fiber.child) return fiber.child;

    let nextFiber = fiber;
    while (nextFiber){
        if (nextFiber.sibling){
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;
    }

    return null;
}

window.Didact = {
    createElement,
    render
}

export default Didact;