import {CSSProperties} from "vue";

export type Size = 'lg' | 'md' | 'sm' | 'xs' | 'xxs'
export type Dir = "ltr" | "rtl" | "auto"


export type LayoutItemRequired = {w: number, h: number, x: number, y: number, i: string};
export type Layout = Array<LayoutItem>;
export type IObject = Record<string, any>
export type ResponsiveLayout = Partial<Record<Size, Layout>>
export type Breakpoint=string
export type Breakpoints = Partial<Record<Size, number>>



export type LayoutItem = LayoutItemRequired &
    {minW?: number, minH?: number, maxW?: number, maxH?: number,
        moved?: boolean, static?: boolean,
        isDraggable?: boolean, isResizable?: boolean};

export type Position = {left: number, top: number, width: number, height: number};

// export type DragEvent = {e: Event} & DragCallbackData;
export type EleSize = {width: number, height: number};
// export type ResizeEvent = {e: Event, node: HTMLElement, size: Size};



export interface IGridItem {
    i:string | number,
    x:number,
    y:number,
    w:number,
    h:number,
    minW?:number,
    minH?:number,
    maxW?:number,
    maxH?:number,
    isDraggable?:boolean,
    isResizable?:boolean,
    isBounded?:boolean,
    static?:boolean,
    dragIgnoreFrom?:string,
    dragAllowFrom?:string,
    resizeIgnoreFrom?:string;
    preserveAspectRatio?:boolean,
    dragOption?:IObject,
    resizeOption?:IObject,
}
export interface IGridLayout {
    style?: CSSProperties,
    layout:Array<LayoutItem>,
    responsiveLayouts?:ResponsiveLayout,
    colNum?:number,
    rowHeight?:number,
    maxRows?:number,
    margin:Array<number>,
    isDraggable?:boolean,
    isResizable?:boolean,
    isMirrored?:boolean,
    isBounded?:boolean,
    autoSize?:boolean,
    restoreOnDrag:boolean
    verticalCompact?:boolean,
    preventCollision?:boolean,
    useCssTransforms?:boolean,
    responsive?:boolean,
    breakpoints?:Breakpoints,
    useStyleCursor?:boolean,
    cols?:Partial<Record<Size, number>>,
}


export type Events = {
    updateWidth?:any,
    compact?:any,
    setDraggable?:boolean,
    setResizable?:any,
    setRowHeight?:number,
    setMaxRows?:number,
    directionChange?:any,
    setColNum?:number,
    dragEvent?:any,
    setBounded?:any
    setTransformScale?:any
    setResizeable?:any
    resizeEvent?:any
};

