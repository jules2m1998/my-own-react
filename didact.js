import {createElement} from "./didact/vdom";
import {createDom, updateDom} from "./didact/dom";
import {DELETION, PLACEMENT, UPDATE} from "./didact/consts";


let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = [];

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
        },
        alternate: currentRoot
    }
    nextUnitOfWork = wipRoot;
    deletions = [];
}

function commitWork(fiber) {
    if(!fiber) return;
    const domParent = fiber.parent.dom;
    if (fiber.effectTag === PLACEMENT && fiber.dom !== null){
        domParent.appendChild(fiber.dom);
    }else if (fiber.effectTag === DELETION) {
        domParent.removeChild(fiber.dom);
        return;
    }else if (fiber.effectTag === UPDATE && fiber.dom !== null){
        updateDom(fiber.dom, fiber.alternate.props, fiber.props)
    }
    commitWork(fiber.sibling)
    commitWork(fiber.child)
}

function commitRoot() {
    deletions.forEach(commitWork)
    commitWork(wipRoot.child);
    currentRoot = wipRoot;
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
    const elements = fiber.props.children;
    reconcileChildren(fiber, elements)
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

function reconcileChildren(wipFiber, elements) {
    let index = 0;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

    let prevSibling = null;
    while (
        index < elements.length ||
        oldFiber != null
        ){
        const element = elements[index];
        const sameType = oldFiber && element && element.type === oldFiber.type;
        let newFiber = null;
        if (sameType){
            newFiber = {
                type: element.type,
                props: element.props,
                parent: wipFiber,
                dom: oldFiber.dom,
                alternate: oldFiber,
                effectTag: UPDATE
            }
        }
        if(element && !sameType){
            newFiber = {
                type: element.type,
                props: element.props,
                parent: wipFiber,
                dom: null,
                alternate: null,
                effectTag: PLACEMENT
            }
        }
        if (oldFiber && !sameType){
            oldFiber.effectTag = DELETION;
            deletions.push(oldFiber);
        }
        if (oldFiber) oldFiber = oldFiber.sibling;
        if (index === 0){
            wipFiber.child = newFiber;
        }else if (element) {
            prevSibling.sibling = newFiber
        }
        prevSibling = newFiber;
        index++;
    }
}

window.Didact = {
    createElement,
    render
}

export default Didact;