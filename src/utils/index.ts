import mitt, {Emitter} from 'mitt'
import {Breakpoint, Breakpoints, CallBackFunction, Dir, Events, Layout, ResponsiveLayout} from "../types";
import {CSSProperties} from "vue";
import {cloneLayout, compact, correctBounds} from './utils';

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

    const translate = `translate3d(${right * -1}px,${top}px, 0)`
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
    const offsetParentRect = (evt as any)?.offsetParent === document.body ? {left: 0, top: 0} : offsetParent.getBoundingClientRect();
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


export function getBreakpointFromWidth(breakpoints: Breakpoints, width: number): string {
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


export function findOrGenerateResponsiveLayout(orgLayout: Layout, layouts: ResponsiveLayout, breakpoints: Breakpoints,
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




