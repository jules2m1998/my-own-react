import {createElement} from "./didact/vdom";
import {createDom, updateDom} from "./didact/dom";
import {DELETION, PLACEMENT, UPDATE} from "./didact/consts";


let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = [];
let hookIndex = null;
let wipFiber = null;

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
    let domParentFiber = fiber.parent;
    while (!domParentFiber.dom){
        domParentFiber = domParentFiber.parent
    }
    const domParent = domParentFiber.dom;
    if (fiber.effectTag === PLACEMENT && fiber.dom !== null){
        domParent.appendChild(fiber.dom);
    }else if (fiber.effectTag === DELETION) {
        commitDeletion(fiber, domParent);
        return;
    }else if (fiber.effectTag === UPDATE && fiber.dom !== null){
        updateDom(fiber.dom, fiber.alternate.props, fiber.props)
        domParent.appendChild(fiber.dom);
    }
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}
function commitDeletion(fiber, domParent) {
    if(fiber.dom) domParent.removeChild(fiber.dom);
    else {
        commitDeletion(fiber.child, domParent)
    }
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
    if (fiber.type instanceof Function){
        updateFunctionComponent(fiber)
    }else {
        updateHostComponent(fiber)
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

function updateFunctionComponent(fiber) {
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = []
    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children)
}
function useState(initial) {
    const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
    const setState = state => {
        hook.state = state;
        render(currentRoot.props.children[0], currentRoot.dom)
    }
    const hook = {
        state: oldHook ? oldHook.state : initial
    }
    wipFiber.hooks.push(hook);

    hookIndex++;
    return [hook.state, setState]
}
function updateHostComponent(fiber) {
    if(!fiber.dom){
        fiber.dom = createDom(fiber);
    }
    const elements = fiber.props.children;
    reconcileChildren(fiber, elements)
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
    render,
    useState
}

export default Didact;