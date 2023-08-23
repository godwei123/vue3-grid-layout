import {CSSProperties} from "vue";
import {CallBackFunction, Dir, IGridItem, Layout, Point} from "../types";
import _ from 'lodash'
import Interact from "@interactjs/types/index";

let currentDir: Dir = "auto";

export function setTransform(top: number, left: number, width: number, height: number): CSSProperties {
    const translate = `translate3d(${left}px, ${top}px, 0)`
    return {
        transform: translate,
        WebkitTransform: translate,
        msTransform: translate,
        width: `${width}px`,
        height: `${height}px`,
        position: 'absolute',
    }
}

// 设置transform
export function setTransformRtl(top: number, right: number, width: number, height: number): CSSProperties {
    const translate = `translate3d(${right * -1}px, ${top}px, 0)`
    return {
        transform: translate,
        WebkitTransform: translate,
        msTransform: translate,
        width: `${width}px`,
        height: `${height}px`,
        position: 'absolute',
    }
}

// 设置CSS
export function setTopLeft(top: number, left: number, width: number, height: number): CSSProperties {
    return {
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
        position: 'absolute',
    }
}

// 设置CSS
export function setTopRight(top: number, right: number, width: number, height: number): CSSProperties {
    return {
        top: `${top}px`,
        right: `${right}px`,
        width: `${width}px`,
        height: `${height}px`,
        position: 'absolute',
    }
}

function hasDocument(): boolean {
    return (typeof document !== "undefined");
}

function hasWindow(): boolean {
    return (typeof window !== "undefined");
}

export function getDocumentDir() {
    if (!hasDocument()) {
        return currentDir;
    }
    return (typeof document.dir !== "undefined") ?
        document.dir :
        document.getElementsByTagName("html")[0].getAttribute("dir");
}

export function setDocumentDir(dir: Dir) {
    if (!hasDocument()) {
        currentDir = dir;
        return;
    }

    const html = document.getElementsByTagName("html")[0];
    html.setAttribute("dir", dir);
}

export function addWindowEventListener(event: string, callback: CallBackFunction) {
    if (!hasWindow()) {
        callback();
        return;
    }
    window.addEventListener(event, callback);
}

export function removeWindowEventListener(event: string, callback: CallBackFunction) {
    if (!hasWindow()) {
        return;
    }
    window.removeEventListener(event, callback);
}


export function validateLayout(layout: Layout, contextName: string = "Layout"): void {
    const subProps: Array<'x' | 'y' | 'w' | 'h'> = ['x', 'y', 'w', 'h'];
    let keys: (string | number | symbol)[] = [];
    if (!Array.isArray(layout)) throw new Error(contextName + " must be an array!");
    for (let i = 0, len = layout.length; i < len; i++) {
        const item = layout[i];
        for (let j = 0; j < subProps.length; j++) {
            const t = subProps[j]
            if (typeof item[t] !== 'number') {
                throw new Error('VueGridLayout: ' + contextName + '[' + i + '].' + subProps[j] + ' must be a number!');
            }
        }
        if (item.i === undefined || item.i === null) {
            throw new Error('VueGridLayout: ' + contextName + '[' + i + '].i cannot be null!');
        }
        if (keys.includes(item.i)) {
            throw new Error('VueGridLayout: ' + contextName + '[' + i + '].i must be unique!');
        }
        keys.push(item.i);
    }
}

export function cloneLayout(layout: Layout) {
    return _.cloneDeep(layout)
}


export function bottom(layout: Layout) {
    let max = 0, bottomY = 0;
    for (const item of layout) {
        bottomY = item.y + item.h;
        max = Math.max(max, bottomY)
    }
    return max;
}

export function getLayoutItem(layout: Layout, id: string | number | symbol) {
    return layout.find(item => item.i === id)
}

export function getStatics(layout: Layout) {
    return layout.filter((l) => l.static);
}

export function sortLayoutItemsByRowCol(layout: Layout) {
    return new Array<IGridItem>().concat(layout).sort(function (a, b) {
        if (a.y === b.y && a.x === b.x) {
            return 0;
        }
        if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
            return 1;
        }
        return -1;
    });
}

export function collides(l1: IGridItem, l2: IGridItem) {
    return !((l1 === l2) || (l1.x + l1.w <= l2.x) || (l1.x >= l2.x + l2.w) || (l1.y + l1.h <= l2.y) || (l1.y >= l2.y + l2.h));
}

export function getAllCollisions(layout: Layout, layoutItem: IGridItem) {
    return layout.filter((l) => collides(l, layoutItem));
}

export function getFirstCollision(layout: Layout, layoutItem: IGridItem) {
    return layout.find(item => collides(item, layoutItem))
}


export function compactItem(compareWith: Layout, l: IGridItem, verticalCompact: boolean, minPositions: any): IGridItem {
    if (verticalCompact) {
        while (l.y > 0 && !getFirstCollision(compareWith, l)) {
            l.y--;
        }
    } else if (minPositions) {
        const minY = minPositions[l.i].y;
        while (l.y > minY && !getFirstCollision(compareWith, l)) {
            l.y--;
        }
    }
    let collides;
    while ((collides = getFirstCollision(compareWith, l))) {
        l.y = collides.y + collides.h;
    }
    return l;
}

export function compact(layout: Layout, verticalCompact: boolean, minPositions?: { [key: number]: Point }) {
    const compareWith = getStatics(layout);
    const sorted = sortLayoutItemsByRowCol(layout);
    const out = Array<IGridItem>(layout.length);
    for (let i = 0, len = sorted.length; i < len; i++) {
        let l = sorted[i];
        if (!l.static) {
            l = compactItem(compareWith, l, verticalCompact, minPositions);
            compareWith.push(l);
        }
        out[layout.indexOf(l)] = l;
        l.moved = false;
    }
    return out;
}

export function getControlPosition(evt: Interact.ResizeEvent | Interact.DragEvent) {
    const offsetParent = (<HTMLElement>evt.target).offsetParent || document.body;
    const offsetParentRect = (<HTMLElement>evt.target).offsetParent === document.body ? {
        left: 0,
        top: 0
    } : offsetParent.getBoundingClientRect();
    const x = evt.clientX + offsetParent.scrollLeft - offsetParentRect.left;
    const y = evt.clientY + offsetParent.scrollTop - offsetParentRect.top;
    return {x, y};
}

//---

export function moveElementAwayFromCollision(layout: Layout, collidesWith: IGridItem, itemToMove: IGridItem, isUserAction: boolean): Layout {
    const preventCollision = false
    if (isUserAction) {
        const fakeItem: IGridItem = {
            x: itemToMove.x,
            y: itemToMove.y,
            w: itemToMove.w,
            h: itemToMove.h,
            i: '-1'
        };
        fakeItem.y = Math.max(collidesWith.y - itemToMove.h, 0);
        if (!getFirstCollision(layout, fakeItem)) {
            return moveElement(layout, itemToMove, true, undefined, fakeItem.y, preventCollision);
        }
    }
    return moveElement(layout, itemToMove, true, undefined, itemToMove.y + 1, preventCollision);
}

export function moveElement(layout: Layout, l: IGridItem, isUserAction: boolean, x?: number, y?: number, preventCollision?: boolean): Layout {
    if (l.static) return layout;

    const oldX = l.x;
    const oldY = l.y;

    const movingUp = y && (l.y > y);
    if (typeof x === 'number') l.x = x;
    if (typeof y === 'number') l.y = y;
    l.moved = true;
    let sorted = sortLayoutItemsByRowCol(layout);
    if (movingUp) sorted = sorted.reverse();
    const collisions = getAllCollisions(sorted, l);

    if (preventCollision && collisions.length) {
        l.x = oldX;
        l.y = oldY;
        l.moved = false;
        return layout;
    }

    for (let i = 0, len = collisions.length; i < len; i++) {
        const collision = collisions[i];
        if (collision.moved) continue;

        if (l.y > collision.y && l.y - collision.y > collision.h / 4) continue;

        if (collision.static) {
            layout = moveElementAwayFromCollision(layout, collision, l, isUserAction);
        } else {
            layout = moveElementAwayFromCollision(layout, l, collision, isUserAction);
        }
    }

    return layout;
}

