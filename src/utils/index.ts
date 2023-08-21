import mitt, {Emitter} from 'mitt'
import {
    Breakpoint,
    Breakpoints,
    CallBackFunction,
    Dir,
    Events,
    IGridItem,
    IObject,
    Layout,
    ResponsiveLayout
} from "../types";
import {CSSProperties} from "vue";

export const emitter: Emitter<Events> = mitt<Events>();
let currentDir: Dir = "auto";

// 设置transform
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

// Get from offsetParent
export function getControlPosition(evt: Event) {
    const offsetParent = (evt.target as HTMLElement)?.offsetParent || document.body;
    const offsetParentRect = (evt as any)?.offsetParent === document.body ? {
        left: 0,
        top: 0
    } : offsetParent.getBoundingClientRect();
    const x = (evt as MouseEvent).clientX + offsetParent.scrollLeft - offsetParentRect.left;
    const y = (evt as MouseEvent).clientY + offsetParent.scrollTop - offsetParentRect.top;
    return {x, y};
}


export function createCoreData(lastX: number, lastY: number, x: number, y: number) {
    const isStart = Number.isNaN(lastX);
    return {
        deltaX: isStart ? 0 : x - lastX,
        deltaY: isStart ? 0 : y - lastY,
        lastX: x,
        lastY: y,
        x: x,
        y: y
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
    if (!hasWindow) {
        callback();
        return;
    }
    window.addEventListener(event, callback);
}

export function removeWindowEventListener(event: string, callback: CallBackFunction) {
    if (!hasWindow) {
        return;
    }
    window.removeEventListener(event, callback);
}


export function getBreakpointFromWidth(breakpoints: Breakpoints, width: number | null) {
    if (!width) return
    const sorted = sortBreakpoints(breakpoints);
    let matching = sorted[0];
    for (let i = 1, len = sorted.length; i < len; i++) {
        const breakpointName = sorted[i];
        if (width > breakpoints[breakpointName]!) matching = breakpointName;
    }
    return matching;
}


export function getColsFromBreakpoint(breakpoint: Breakpoint, cols: Breakpoints): number {
    if (!cols[breakpoint]) {
        throw new Error("ResponsiveGridLayout: `cols` entry for breakpoint " + breakpoint + " is missing!");
    }
    return cols[breakpoint]!;
}


export function findOrGenerateResponsiveLayout(orgLayout: Layout | null, layouts: ResponsiveLayout, breakpoints: Breakpoints,
                                               breakpoint: Breakpoint,
                                               cols: number, verticalCompact: boolean): Layout {
    if (layouts[breakpoint]) return cloneLayout(layouts[breakpoint]!);

    let layout = orgLayout;

    const breakpointsSorted = sortBreakpoints(breakpoints);
    const breakpointsAbove = breakpointsSorted.slice(breakpointsSorted.indexOf(breakpoint));
    for (let i = 0, len = breakpointsAbove.length; i < len; i++) {
        const b = breakpointsAbove[i];
        if (layouts[b]) {
            layout = layouts[b]!;
            break;
        }
    }
    layout = cloneLayout(layout || []);
    return compact(correctBounds(layout, {cols: cols}), verticalCompact);
}

export function sortBreakpoints(breakpoints: Breakpoints) {
    const keys = Object.keys(breakpoints) as Breakpoint[]
    return keys.sort((a: Breakpoint, b: Breakpoint) => {
        return breakpoints[a]! - breakpoints[b]!;
    });
}


export function bottom(layout: Layout): number {
    let max = 0, bottomY;
    for (let i = 0, len = layout.length; i < len; i++) {
        bottomY = layout[i].y + layout[i].h;
        if (bottomY > max) max = bottomY;
    }
    return max;
}

export function cloneLayout(layout: Layout): Layout {
    const newLayout = Array(layout.length);
    for (let i = 0, len = layout.length; i < len; i++) {
        newLayout[i] = cloneLayoutItem(layout[i]);
    }
    return newLayout;
}


export function cloneLayoutItem(layoutItem: IGridItem): IGridItem {
    return JSON.parse(JSON.stringify(layoutItem));
}


export function collides(l1: IGridItem, l2: IGridItem): boolean {
    if (l1 === l2) return false;
    if (l1.x + l1.w <= l2.x) return false;
    if (l1.x >= l2.x + l2.w) return false;
    if (l1.y + l1.h <= l2.y) return false;
    if (l1.y >= l2.y + l2.h) return false;
    return true;
}

export function compact(layout: Layout, verticalCompact: boolean, minPositions?: any): Layout {
    const compareWith = getStatics(layout);
    const sorted = sortLayoutItemsByRowCol(layout);
    const out = Array(layout.length);
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

export function correctBounds(layout: Layout, bounds: {
    cols: number
}): Layout {
    const collidesWith = getStatics(layout);
    for (let i = 0, len = layout.length; i < len; i++) {
        const l = layout[i];
        if (l.x + l.w > bounds.cols) l.x = bounds.cols - l.w;
        if (l.x < 0) {
            l.x = 0;
            l.w = bounds.cols;
        }
        if (!l.static) collidesWith.push(l);
        else {
            while (getFirstCollision(collidesWith, l)) {
                l.y++;
            }
        }
    }
    return layout;
}


export function getLayoutItem(layout: Layout, id?: string): IGridItem | undefined {
    for (let i = 0, len = layout.length; i < len; i++) {
        if (layout[i].i === id) return layout[i];
    }
}

export function getFirstCollision(layout: Layout, layoutItem: IGridItem): IGridItem | void {
    for (let i = 0, len = layout.length; i < len; i++) {
        if (collides(layout[i], layoutItem)) return layout[i];
    }
}

export function getAllCollisions(layout: Layout, layoutItem: IGridItem): Array<IGridItem> {
    return layout.filter((l) => collides(l, layoutItem));
}

export function getStatics(layout: Layout): Array<IGridItem> {
    return layout.filter((l) => l.static);
}

export function moveElement(layout: Layout, l: IGridItem, x: number | undefined, y: number | undefined, isUserAction: boolean, preventCollision?: boolean): Layout {
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


export function moveElementAwayFromCollision(layout: Layout, collidesWith: IGridItem,
                                             itemToMove: IGridItem, isUserAction: boolean): Layout {

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
            return moveElement(layout, itemToMove, undefined, fakeItem.y, preventCollision);
        }
    }

    return moveElement(layout, itemToMove, undefined, itemToMove.y + 1, preventCollision);
}

export function percentage(num: number): string {
    return num * 100 + '%';
}


export function sortLayoutItemsByRowCol(layout: Layout): Layout {
    return ([] as any).concat(layout).sort(function (a, b) {
        if (a.y === b.y && a.x === b.x) {
            return 0;
        }

        if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
            return 1;
        }
        return -1;
    });
}

export function validateLayout(layout: Layout, contextName?: string): void {
    contextName = contextName || "Layout";
    const subProps = ['x', 'y', 'w', 'h'];
    let keyArr = [];
    if (!Array.isArray(layout)) throw new Error(contextName + " must be an array!");
    for (let i = 0, len = layout.length; i < len; i++) {
        const item = layout[i];
        for (let j = 0; j < subProps.length; j++) {
            const t = subProps[j] as 'x' | 'y' | 'w' | 'h'
            if (typeof item[t] !== 'number') {
                throw new Error('VueGridLayout: ' + contextName + '[' + i + '].' + subProps[j] + ' must be a number!');
            }
        }

        if (item.i === undefined || item.i === null) {
            throw new Error('VueGridLayout: ' + contextName + '[' + i + '].i cannot be null!');
        }

        if (keyArr.indexOf(item.i) >= 0) {
            throw new Error('VueGridLayout: ' + contextName + '[' + i + '].i must be unique!');
        }
        keyArr.push(item.i);

        if (item.static !== undefined && typeof item.static !== 'boolean') {
            throw new Error('VueGridLayout: ' + contextName + '[' + i + '].static must be a boolean!');
        }
    }
}


export function createMarkup(obj: IObject) {
    let keys = Object.keys(obj);
    if (!keys.length) return '';
    let i, len = keys.length;
    let result = '';

    for (i = 0; i < len; i++) {
        let key = keys[i];
        let val = obj[key];
        result += hyphenate(key) + ':' + addPx(key as any, val) + ';';
    }

    return result;
}


export const IS_UNITLESS = {
    animationIterationCount: true,
    boxFlex: true,
    boxFlexGroup: true,
    boxOrdinalGroup: true,
    columnCount: true,
    flex: true,
    flexGrow: true,
    flexPositive: true,
    flexShrink: true,
    flexNegative: true,
    flexOrder: true,
    gridRow: true,
    gridColumn: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    tabSize: true,
    widows: true,
    zIndex: true,
    zoom: true,
    fillOpacity: true,
    stopOpacity: true,
    strokeDashoffset: true,
    strokeOpacity: true,
    strokeWidth: true
};

export function addPx(name: keyof typeof IS_UNITLESS, value: unknown) {
    if (typeof value === 'number' && !IS_UNITLESS[name]) {
        return `${value}px`;
    } else {
        return value;
    }
}

export let hyphenateRE = /([a-z\d])([A-Z])/g;

export function hyphenate(str: string) {
    return str.replace(hyphenateRE, '$1-$2').toLowerCase();
}


export function findItemInArray(array: Array<IGridItem>, property: keyof IGridItem, value: any) {
    for (let i = 0; i < array.length; i++)
        if (array[i][property] == value)
            return true;
    return false;
}

export function findAndRemove(array: Array<IGridItem>, property: keyof IGridItem, value: any) {
    array.forEach(function (result, index) {
        if (result[property] === value) {
            array.splice(index, 1);
        }
    });
}

export const findDifference = (layout: Layout, originalLayout: Layout) => {
    let uniqueResultOne = layout.filter(function (obj) {
        return !originalLayout.some(function (obj2) {
            return obj.i === obj2.i;
        });
    });

    let uniqueResultTwo = originalLayout.filter(function (obj) {
        return !layout.some(function (obj2) {
            return obj.i === obj2.i;
        });
    });
    return uniqueResultOne.concat(uniqueResultTwo);
}


export const isAndroid = () => {
    return navigator.userAgent.toLowerCase().indexOf("android") !== -1;
}

export const clamp = (num: number, lowerBound: number, upperBound: number) => {
    return Math.max(Math.min(num, upperBound), lowerBound);
}
export const calcGridItemWHPx = (gridUnits: number, colOrRowSize: number, marginPx: number) => {
    if (!Number.isFinite(gridUnits)) return gridUnits;
    return Math.round(
        colOrRowSize * gridUnits + Math.max(0, gridUnits - 1) * marginPx
    );
}
