import { CSSProperties } from 'vue'

export type ISize = 'lg' | 'md' | 'sm' | 'xs' | 'xxs'
export type Dir = 'ltr' | 'rtl' | 'auto'

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export type PositionRight = { top: number; width: number; right: number; height: number }
export type PositionLeft = { top: number; left: number; width: number; height: number }
export type Position = PositionLeft | PositionRight

export interface Rect {
  top: number
  left: number
  bottom: number
  right: number
  width?: number
  height?: number
}

export type FullRect = Required<Rect>
export type RectFunction<T extends any[]> = (...args: T) => Rect | Element
export type RectResolvable<T extends any[]> = Rect | string | Element | RectFunction<T>
export type Dimensions = Point & Size

export type CallBackFunction = (...args: any) => void

export type LayoutItemRequired = {
  w: number
  h: number
  x: number
  y: number
  i: string | number | symbol
}
export type Layout = Array<IGridItem>
export type IObject = Record<string, any>
export type ResponsiveLayout = Record<ISize, Layout>

export type Breakpoints = Record<ISize, number>
export type Breakpoint = keyof Breakpoints
export type Cols = Record<ISize, number>

export interface ItemPropsType extends IGridItem {
  margin?: [number, number]
}

export type EleSize = {
  width: number
  height: number
}

export interface IGridItem extends LayoutItemRequired {
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  isDraggable?: boolean | null
  isResizable?: boolean | null
  isBounded?: boolean | null
  static?: boolean
  dragIgnoreFrom?: string
  dragAllowFrom?: string
  resizeIgnoreFrom?: string
  preserveAspectRatio?: boolean
  dragOption?: IObject
  resizeOption?: IObject
  moved?: boolean
}

export interface LayoutPropType {
  style?: CSSProperties
  layout: Array<IGridItem>
  responsiveLayouts?: ResponsiveLayout | {}
  colNum?: number
  rowHeight?: number
  maxRows?: number
  margin?: [number, number]
  isDraggable?: boolean
  isResizable?: boolean
  isMirrored?: boolean
  isBounded?: boolean
  autoSize?: boolean
  restoreOnDrag?: boolean
  verticalCompact?: boolean
  preventCollision?: boolean
  useCssTransforms?: boolean
  responsive?: boolean
  breakpoints?: Breakpoints
  useStyleCursor?: boolean
  cols?: Cols
  transformScale?: number
}

export interface LayoutState {
  width: number
  mergeStyles: CSSProperties
  lastLayoutLength: number
  isDragging: boolean
  placeholder: IGridItem
  layouts: ResponsiveLayout
  lastBreakpoint: null | Breakpoint
  originalLayout: null | Layout
}

export interface ItemState {
  cols: number
  containerWidth: number
  rowHeight: number
  margin: [number, number]
  maxRows: number
  draggable: null | boolean
  resizable: null | boolean
  bounded: null | boolean
  transformScale: number
  useCssTransforms: boolean
  useStyleCursor: boolean
  isDragging: boolean
  isResizing: boolean
  dragging: null | IObject
  resizing: null | IObject
  lastX: number
  lastY: number
  lastW: number
  lastH: number
  style: CSSProperties
  rtl: boolean

  dragEventSet: boolean
  resizeEventSet: boolean

  previousW: null | number
  previousH: null | number
  previousX: null | number
  previousY: null | number
  innerX: number
  innerY: number
  innerW: number
  innerH: number
}
