import {Breakpoint, Breakpoints, IGridItem, IObject, Layout, ResponsiveLayout} from "../types";


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
