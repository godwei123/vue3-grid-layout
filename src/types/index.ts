import {CSSProperties} from "vue";
import _NativePointerEventType from "@interactjs/core/NativePointerEventType";
import {InteractEvent} from "@interactjs/core/InteractEvent";
import {ListenerMap} from "@interactjs/core/types";

export type ISize = 'lg' | 'md' | 'sm' | 'xs' | 'xxs'
export type Dir = "ltr" | "rtl" | "auto"

export type Element = HTMLElement | SVGElement;
export type Context = Document | Element;
export type EventTarget = Window | Document | Element;
export type Target = EventTarget | string;

export interface Point {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Rect {
    top: number;
    left: number;
    bottom: number;
    right: number;
    width?: number;
    height?: number;
}

export type FullRect = Required<Rect>;
export type RectFunction<T extends any[]> = (...args: T) => Rect | Element;
export type RectResolvable<T extends any[]> = Rect | string | Element | RectFunction<T>;
export type Dimensions = Point & Size;

export type NativePointerEventType = typeof _NativePointerEventType;
export type PointerEventType = MouseEvent | TouchEvent | Partial<NativePointerEventType> | InteractEvent;
export type PointerType = MouseEvent | Touch | Partial<NativePointerEventType> | InteractEvent;
export type EventTypes = string | ListenerMap | Array<string | ListenerMap>;

export type CallBackFunction = (...args: any) => any;

export type LayoutItemRequired = {
    w: number,
    h: number,
    x: number,
    y: number,
    i: string
};
export type Layout = Array<IGridItem>;
export type IObject = Record<string, any>
export type ResponsiveLayout = Partial<Record<ISize, Layout>>
export type PartialRecordSize = Partial<Record<ISize, number>>

export type Breakpoints = PartialRecordSize
export type Breakpoint = keyof Breakpoints;
export type Cols = PartialRecordSize


export type ItemPropsType = IGridItem & { margin?: [number, number] }

export type Position = {
    left: number,
    top: number,
    width: number,
    height: number
};

export type EleSize = {
    width: number,
    height: number
};


export interface IGridItem extends LayoutItemRequired {
    minW?: number,
    minH?: number,
    maxW?: number,
    maxH?: number,
    isDraggable?: boolean,
    isResizable?: boolean,
    isBounded?: boolean,
    static?: boolean,
    dragIgnoreFrom?: string,
    dragAllowFrom?: string,
    resizeIgnoreFrom?: string;
    preserveAspectRatio?: boolean,
    dragOption?: IObject,
    resizeOption?: IObject,
    moved?: boolean
}

export interface IGridLayout {
    style?: CSSProperties,
    layout: Array<IGridItem>,
    responsiveLayouts?: ResponsiveLayout,
    colNum?: number,
    rowHeight?: number,
    maxRows?: number,
    margin?: [number, number],
    isDraggable?: boolean,
    isResizable?: boolean,
    isMirrored?: boolean,
    isBounded?: boolean,
    autoSize?: boolean,
    restoreOnDrag: boolean
    verticalCompact?: boolean,
    preventCollision?: boolean,
    useCssTransforms?: boolean,
    responsive?: boolean,
    breakpoints?: Breakpoints,
    useStyleCursor?: boolean,
    cols?: Cols,
}


export type Events = {
    updateWidth?: any,
    compact?: any,
    setDraggable: boolean,
    setResizable: boolean,
    setRowHeight: number,
    setMaxRows: number,
    setColNum: string | number,
    setBounded: boolean
    directionChange?: any,
    setTransformScale?: any
    setResizeable?: boolean
    resizeEvent: ({
        eventName: string,
        id: string,
        x: number,
        y: number,
        h: number,
        w: number
    }) | undefined
    dragEvent: {
        eventName: string,
        id: string,
        x: number,
        y: number,
        h: number,
        w: number
    },
    setMargin: [number, number]
};

