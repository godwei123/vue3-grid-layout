<template>
  <div ref="itemRef"
       class="vue3-grid-item"
       :class="classObj"
       :style="state.style"
       :id="String(i)"
  >
    <slot></slot>
    <span v-if="resizableAndNotStatic" :class="resizableHandleClass"></span>
  </div>
</template>

<script setup lang="ts">
import {IGridLayout, ItemPropsType, ItemState, LayoutState, Position} from "../types";
import {computed, CSSProperties, inject, onBeforeUnmount, onMounted, reactive, ref, unref, watch} from "vue";
import {
  calcGridItemWHPx,
  clamp,
  createCoreData,
  emitter,
  getColsFromBreakpoint,
  getControlPosition,
  getDocumentDir,
  setTopLeft,
  setTopRight,
  setTransform,
  setTransformRtl
} from "../utils/helpers.js";
import interact from '@interactjs/interact';
import '@interactjs/auto-start';
import '@interactjs/auto-scroll';
import '@interactjs/actions/drag';
import '@interactjs/actions/resize';
import '@interactjs/modifiers';
import '@interactjs/dev-tools';
import {DraggableOptions} from '@interactjs/actions/drag/plugin';
import {Interactable} from "@interactjs/core/Interactable";
import Interact from "@interactjs/types/index";
import {ResizableOptions} from "@interactjs/actions/resize/plugin";

const props = withDefaults(defineProps<ItemPropsType>(), {
  static: false,
  minH: 1,
  minW: 1,
  maxH: Infinity,
  maxW: Infinity,
  isDraggable: null,
  isResizable: null,
  isBounded: null,
  dragIgnoreFrom: 'a, button',
  resizeIgnoreFrom: 'a, button',
  preserveAspectRatio: false,
  dragOption: () => ({}),
  resizeOption: () => ({})
})
const emit = defineEmits(['move', 'resize', 'moved', 'resized', 'containerResized'])
const itemRef = ref<HTMLElement | null>()
let instance: Interactable;
const layout = inject<Required<Omit<LayoutState & IGridLayout, 'layout'>>>('layout', {})


const state = reactive<ItemState>({
  cols: 1,
  containerWidth: 100,
  rowHeight: 30,
  margin: [10, 10],
  maxRows: Infinity,
  draggable: null,
  resizable: null,
  bounded: null,
  transformScale: 1,
  useCssTransforms: true,
  useStyleCursor: true,
  isDragging: false,
  isResizing: false,
  resizing: null,
  dragging: null,
  lastX: NaN,
  lastY: NaN,
  lastW: NaN,
  lastH: NaN,
  style: {},
  rtl: false,
  dragEventSet: false,
  resizeEventSet: false,
  previousW: null,
  previousH: null,
  previousX: null,
  previousY: null,
  innerX: props.x,
  innerY: props.y,
  innerW: props.w,
  innerH: props.h,
})


const resizableAndNotStatic = computed(() => state.resizable && !props.static)
const draggableOrResizableAndNotStatic = computed(() => (state.draggable || state.resizable) && !props.static)
const renderRtl = computed(() => (layout.isMirrored) ? !state.rtl : state.rtl)
const resizableHandleClass = computed<string>(() => renderRtl.value ? 'vue3-resizable-handle vue3-rtl-resizable-handle' : 'vue3-resizable-handle')

const classObj = computed(() => ({
  'vue-resizable': resizableAndNotStatic.value,
  'static': props.static,
  'resizing': state.isResizing,
  'vue-draggable-dragging': state.isDragging,
  'cssTransforms': state.useCssTransforms,
  'render-rtl': renderRtl.value,
  'disable-userselect': state.isDragging,
  'no-touch': draggableOrResizableAndNotStatic.value
}))


const updateWidthHandler = (width: number) => {
  updateWidth(width)
}

const compactHandler = () => {
  compact();
};


const setDraggableHandler = (isDraggable: boolean | null) => {
  if (isDraggable === null) return
  state.draggable = isDraggable;
}
const setResizableHandler = (isResizable: boolean | null) => {
  if (isResizable === null) return
  state.resizable = isResizable;
}

const setBoundedHandler = (isBounded: boolean | null) => {
  if (isBounded === null) return
  state.bounded = isBounded;
};

const setTransformScaleHandler = (value: number) => {
  state.transformScale = value
};

const setRowHeightHandler = (value: number) => {
  state.rowHeight = value;
};

const setMaxRowsHandler = (value: number) => {
  state.maxRows = value;
};

const directionChangeHandler = () => {
  state.rtl = getDocumentDir() === 'rtl';
  compact();
};

const setColNumHandler = (colNum: string | number) => {
  state.cols = typeof colNum === "string" ? parseInt(colNum) : colNum;
}


onMounted(() => {
  if (layout.responsive && layout.lastBreakpoint) {
    state.cols = getColsFromBreakpoint(layout.lastBreakpoint, layout.cols);
  } else {
    state.cols = layout.colNum;
  }
  state.rowHeight = layout.rowHeight;
  state.containerWidth = layout.width !== null ? layout.width : 100;
  state.margin = layout.margin !== undefined ? layout.margin : [10, 10];
  state.maxRows = layout.maxRows;
  state.draggable = props.isDraggable ?? layout.isDraggable;
  state.resizable = props.isResizable ?? layout.isResizable
  state.bounded = props.isBounded ?? layout.isBounded
  state.transformScale = layout.transformScale
  state.useCssTransforms = layout.useCssTransforms;
  state.useStyleCursor = layout.useStyleCursor;
  createStyle();
})


const calcColWidth = () => (state.containerWidth - (state.margin[0] * (state.cols + 1))) / state.cols

const calcXY = (top: number, left: number) => {
  const colWidth = calcColWidth()
  let x = Math.round((left - state.margin[0]) / (colWidth + state.margin[0]));
  let y = Math.round((top - state.margin[1]) / (state.rowHeight + state.margin[1]));
  x = Math.max(Math.min(x, state.cols - state.innerW), 0);
  y = Math.max(Math.min(y, state.maxRows - state.innerH), 0);

  return {x, y};
}

const calcWH = (height: number, width: number, autoSizeFlag = false) => {
  const colWidth = calcColWidth()
  let w = Math.round((width + state.margin[0]) / (colWidth + state.margin[0]));
  let h = 0;
  if (!autoSizeFlag) {
    h = Math.round((height + state.margin[1]) / (state.rowHeight + state.margin[1]));
  } else {
    h = Math.ceil((height + state.margin[1]) / (state.rowHeight + state.margin[1]));
  }
  w = Math.max(Math.min(w, state.cols - state.innerX), 0);
  h = Math.max(Math.min(h, state.maxRows - state.innerY), 0);
  return {w, h};
}


const calcPosition = (x: number, y: number, w: number, h: number): Position => {
  const colWidth = calcColWidth()
  const result = renderRtl.value ? {
    right: Math.round(colWidth * x + (x + 1) * state.margin[0]),
    top: Math.round(state.rowHeight * y + (y + 1) * state.margin[1]),
    width: w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * state.margin[0]),
    height: h === Infinity ? h : Math.round(state.rowHeight * h + Math.max(0, h - 1) * state.margin[1])
  } : {
    left: Math.round(colWidth * x + (x + 1) * state.margin[0]),
    top: Math.round(state.rowHeight * y + (y + 1) * state.margin[1]),
    width: w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * state.margin[0]),
    height: h === Infinity ? h : Math.round(state.rowHeight * h + Math.max(0, h - 1) * state.margin[1])
  }
  return result
}

const createStyle = () => {
  if (props.x + props.w > state.cols) {
    state.innerX = 0;
    state.innerW = Math.min(props.w, state.cols)
  } else {
    state.innerX = props.x;
    state.innerW = props.w;
  }
  const pos = calcPosition(state.innerX, state.innerY, state.innerW, state.innerH);
  if (state.isDragging) {
    pos.top = state.dragging?.top;
    if (renderRtl.value) {
      pos.right = state.dragging?.left;
    } else {
      pos.left = state.dragging?.left;
    }
  }
  if (state.isResizing) {
    pos.width = state.resizing?.width;
    pos.height = state.resizing?.height;
  }
  let style: CSSProperties
  if (state.useCssTransforms) {
    if (renderRtl.value) {
      style = setTransformRtl(pos.top, pos.right || 0, pos.width, pos.height);
    } else {
      style = setTransform(pos.top, pos.left || 0, pos.width, pos.height);
    }
  } else {
    if (renderRtl.value) {
      style = setTopRight(pos.top, pos.right || 0, pos.width, pos.height);
    } else {
      style = setTopLeft(pos.top, pos.left || 0, pos.width, pos.height);
    }
  }
  state.style = style
}

const emitContainerResized = () => {
  let styleProps: {
    [key: string]: any
  } = {};
  for (let prop of ['width', 'height']) {
    let val = state.style[prop as 'width' | 'height'];
    let matches = String(val)?.match(/^(\d+)px$/);
    if (!matches) return;
    styleProps[prop] = matches[1];
  }
  emit("containerResized", props.i, props.h, props.w, styleProps.height, styleProps.width);
}

const compact = () => {
  createStyle();
}


//---------------------------------

const updateWidth = (width: number, colNum?: number) => {
  state.containerWidth = width;
  if (colNum) {
    state.cols = colNum;
  }
}


const handleResize = (event: Interact.ResizeEvent) => {
  if (props.static) return;
  const position = getControlPosition(event);
  if (position === null) return;
  const {x, y} = position;

  const newSize = {width: 0, height: 0};
  let pos;
  switch (event.type) {
    case "resizestart": {
      tryMakeResizable()
      state.previousW = state.innerW;
      state.previousH = state.innerH;
      pos = calcPosition(state.innerX, state.innerY, state.innerW, state.innerH);
      newSize.width = pos.width;
      newSize.height = pos.height;
      state.resizing = newSize;
      state.isResizing = true;
      break;
    }
    case "resizemove": {
      const coreEvent = createCoreData(state.lastW, state.lastH, x, y);
      if (unref(renderRtl)) {
        newSize.width = state.resizing?.width - coreEvent.deltaX / state.transformScale;
      } else {
        newSize.width = state.resizing?.width + coreEvent.deltaX / state.transformScale;
      }
      newSize.height = state.resizing?.height + coreEvent.deltaY / state.transformScale;

      state.resizing = newSize;
      break;
    }
    case "resizeend": {
      pos = calcPosition(state.innerX, state.innerY, state.innerW, state.innerH);
      newSize.width = pos.width;
      newSize.height = pos.height;
      state.resizing = null;
      state.isResizing = false;
      break;
    }
  }
  pos = calcWH(newSize.height, newSize.width);

  pos.w = Math.max(Math.min(Math.max(pos.w, props.minW), props.maxW), 1)
  pos.h = Math.max(Math.min(Math.max(pos.h, props.minH), props.maxH), 1)

  state.lastW = x;
  state.lastH = y;

  if (state.innerW !== pos.w || state.innerH !== pos.h) {
    emit('resize', props.i, pos.h, pos.w, newSize.height, newSize.width);
  }
  if (event.type === 'resizeend' && (state.previousW !== state.innerW || state.previousH !== state.innerH)) {
    emit('resized', props.i, pos.h, pos.w, newSize.height, newSize.width);
  }
  emitter.emit('resizeEvent', [
    event.type, props.i, state.innerX, state.innerY, pos.h, pos.w,
  ]);
}

const handleDrag = (event: Interact.DragEvent) => {
  if (props.static) return;
  if (state.isResizing) return;

  const position = getControlPosition(event);
  if (position === null) return;
  const {x, y} = position;

  let newPosition = {top: 0, left: 0};
  switch (event.type) {
    case "dragstart": {
      state.previousX = state.innerX;
      state.previousY = state.innerY;

      const parentRect = event.target.offsetParent.getBoundingClientRect();
      const clientRect = event.target.getBoundingClientRect();

      const cLeft = clientRect.left / state.transformScale;
      const pLeft = parentRect.left / state.transformScale;
      const cRight = clientRect.right / state.transformScale;
      const pRight = parentRect.right / state.transformScale;
      const cTop = clientRect.top / state.transformScale;
      const pTop = parentRect.top / state.transformScale;

      if (unref(renderRtl)) {
        newPosition.left = (cRight - pRight) * -1;
      } else {
        newPosition.left = cLeft - pLeft;
      }
      newPosition.top = cTop - pTop;
      state.dragging = newPosition;
      state.isDragging = true;
      break;
    }
    case "dragend": {
      if (!state.isDragging) return;
      const parentRect = event.target.offsetParent.getBoundingClientRect();
      const clientRect = event.target.getBoundingClientRect();

      const cLeft = clientRect.left / state.transformScale;
      const pLeft = parentRect.left / state.transformScale;
      const cRight = clientRect.right / state.transformScale;
      const pRight = parentRect.right / state.transformScale;
      const cTop = clientRect.top / state.transformScale;
      const pTop = parentRect.top / state.transformScale;
      if (unref(renderRtl)) {
        newPosition.left = (cRight - pRight) * -1;
      } else {
        newPosition.left = cLeft - pLeft;
      }
      newPosition.top = cTop - pTop;
      state.dragging = null;
      state.isDragging = false;
      break;
    }
    case "dragmove": {
      const coreEvent = createCoreData(state.lastX, state.lastY, x, y);
      if (unref(renderRtl)) {
        newPosition.left = state.dragging?.left - coreEvent.deltaX / state.transformScale;
      } else {
        newPosition.left = state.dragging?.left + coreEvent.deltaX / state.transformScale;
      }
      newPosition.top = state.dragging?.top + coreEvent.deltaY / state.transformScale;
      if (state.bounded) {
        const bottomBoundary = event.target.offsetParent.clientHeight - calcGridItemWHPx(props.h, state.rowHeight, state.margin[1]);
        newPosition.top = clamp(newPosition.top, 0, bottomBoundary);
        const colWidth = calcColWidth();
        const rightBoundary = state.containerWidth - calcGridItemWHPx(props.w, colWidth, state.margin[0]);
        newPosition.left = clamp(newPosition.left, 0, rightBoundary);
      }
      state.dragging = newPosition;
      break;
    }
  }

  let pos;
  if (renderRtl.value) {
    pos = calcXY(newPosition.top, newPosition.left);
  } else {
    pos = calcXY(newPosition.top, newPosition.left);
  }

  state.lastX = x;
  state.lastY = y;

  if (state.innerX !== pos.x || state.innerY !== pos.y) {
    emit('move', props.i, pos.x, pos.y);
  }
  if (event.type === 'dragend' && (state.previousX !== state.innerX || state.previousY !== state.innerY)) {
    emit('moved', props.i, pos.x, pos.y);
  }
  emitter.emit('dragEvent', [
    event.type, props.i, pos.x, pos.y, state.innerH, state.innerW,
  ]);
}


const tryMakeDraggable = () => {
  if (!instance) {
    instance = interact(<HTMLElement>itemRef.value);
    if (!state.useStyleCursor) instance.styleCursor(false);
  }
  if (state.draggable && !props.static) {
    const opts: DraggableOptions = {
      ignoreFrom: props.dragIgnoreFrom,
      allowFrom: props.dragAllowFrom,
      ...props.dragOption
    };
    instance.draggable(opts);
    if (!state.dragEventSet) {
      state.dragEventSet = true;
      instance.on('dragstart dragmove dragend', (event: Interact.DragEvent) => {
        handleDrag(event);
      });
    }
  } else {
    instance.draggable({
      enabled: false
    });
  }
}
const tryMakeResizable = () => {
  if (!instance) {
    instance = interact(<HTMLElement>itemRef.value);
    if (!state.useStyleCursor) {
      instance.styleCursor(false);
    }
  }
  if (state.resizable && !props.static) {
    let maximum = calcPosition(0, 0, props.maxW, props.maxH);
    let minimum = calcPosition(0, 0, props.minW, props.minH);
    const opts: ResizableOptions = {
      edges: {
        left: false,
        right: `.${resizableHandleClass.value.trim().replace(" ", ".")}`,
        bottom: `.${resizableHandleClass.value.trim().replace(" ", ".")}`,
        top: false
      },
      ignoreFrom: props.resizeIgnoreFrom,
      ...props.resizeOption,
    };
    opts.modifiers = [
      interact.modifiers.restrictSize({
        min: {
          height: minimum.height * state.transformScale,
          width: minimum.width * state.transformScale
        },
        max: {
          height: maximum.height * state.transformScale,
          width: maximum.width * state.transformScale
        }
      },)]

    if (props.preserveAspectRatio) {
      opts.modifiers = [
        interact.modifiers.aspectRatio({
          ratio: 'preserve'
        }),
        interact.modifiers.restrictSize({
          min: {
            height: minimum.height * state.transformScale,
            width: minimum.width * state.transformScale
          },
          max: {
            height: maximum.height * state.transformScale,
            width: maximum.width * state.transformScale
          }
        },)
      ]
    }
    instance.resizable(opts);
    if (!state.resizeEventSet) {
      state.resizeEventSet = true;
      instance.on('resizestart resizemove resizeend', (event: Interact.ResizeEvent) => {
        handleResize(event);
      });
    }
  } else {
    instance.resizable({
      enabled: false
    });
  }
}


watch(() => props.isDraggable, () => state.draggable = props.isDraggable)
watch(() => props.static, () => {
  tryMakeDraggable();
  tryMakeResizable();
})
watch(() => state.draggable, () => tryMakeDraggable())
watch(() => state.resizable, () => tryMakeResizable())
watch(() => props.isResizable, () => state.resizable = props.isResizable)
watch(() => props.isBounded, () => state.bounded = props.isBounded)
watch(() => state.rowHeight, () => {
  createStyle();
  emitContainerResized();
})
watch(() => state.cols, () => {
  tryMakeResizable();
  createStyle();
  emitContainerResized();
})
watch(() => state.containerWidth, () => {
  tryMakeResizable();
  createStyle();
  emitContainerResized();
})

watch(() => props.x, (value) => {
  state.innerX = value;
  createStyle();
})
watch(() => props.y, (value) => {
  state.innerY = value;
  createStyle();
})
watch(() => props.h, (value) => {
  state.innerH = value;
  createStyle();
})
watch(() => props.w, (value) => {
  state.innerW = value;
  createStyle();
})

watch([() => props.minH, () => props.maxH, () => props.minW, () => props.maxW], () => {
  tryMakeResizable();
})

watch(renderRtl, () => {
  tryMakeResizable();
  createStyle();
})

watch(() => layout.margin, (value) => {
  if (!value || (Number(value[0]) === Number(state.margin[0]) && Number(value[1]) === Number(state.margin[1]))) {
    return
  }
  state.margin = value.map(v => Number(v))
  createStyle()
  emitContainerResized()
})

emitter.on('updateWidth', updateWidthHandler)
emitter.on('compact', compactHandler);
emitter.on('setDraggable', setDraggableHandler);
emitter.on('setResizable', setResizableHandler);
emitter.on('setBounded', setBoundedHandler);
emitter.on('setRowHeight', setRowHeightHandler);
emitter.on('setMaxRows', setMaxRowsHandler);
emitter.on('directionChange', directionChangeHandler);
emitter.on('setColNum', setColNumHandler)
emitter.on('setTransformScale', setTransformScaleHandler)
state.rtl = getDocumentDir() === 'rtl'

onBeforeUnmount(() => {
  emitter.off('updateWidth', updateWidthHandler)
  emitter.off('compact', compactHandler);
  emitter.off('setDraggable', setDraggableHandler);
  emitter.off('setResizable', setResizableHandler);
  emitter.off('setRowHeight', setRowHeightHandler);
  emitter.off('setMaxRows', setMaxRowsHandler);
  emitter.off('directionChange', directionChangeHandler);
  emitter.off('setColNum', setColNumHandler)
  emitter.off('setBounded', setBoundedHandler);
  emitter.off('setTransformScale', setTransformScaleHandler)
  if (instance) {
    instance.unset()
  }
})

</script>

<style scoped>

.vue3-grid-item {
  transition: all 200ms ease;
  transition-property: left, top, right;
  box-sizing: border-box;
}

.vue3-grid-item.no-touch {
  -ms-touch-action: none;
  touch-action: none;
}

.vue3-grid-item.cssTransforms {
  transition-property: transform;
  left: 0;
  right: auto;
}

.vue3-grid-item.cssTransforms.render-rtl {
  left: auto;
  right: 0;
}

.vue3-grid-item.resizing {
  opacity: 0.6;
  z-index: 3;
}

.vue3-grid-item.vue-draggable-dragging {
  transition: none;
  z-index: 3;
}

.vue3-grid-item.vue3-grid-placeholder {
  background: red;
  opacity: 0.2;
  transition-duration: 100ms;
  z-index: 2;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  user-select: none;
}

.vue3-grid-item > .vue3-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  bottom: 0;
  right: 0;
  padding: 0 3px 3px 0;
  background: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg08IS0tIEdlbmVyYXRvcjogQWRvYmUgRmlyZXdvcmtzIENTNiwgRXhwb3J0IFNWRyBFeHRlbnNpb24gYnkgQWFyb24gQmVhbGwgKGh0dHA6Ly9maXJld29ya3MuYWJlYWxsLmNvbSkgLiBWZXJzaW9uOiAwLjYuMSAgLS0+DTwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DTxzdmcgaWQ9IlVudGl0bGVkLVBhZ2UlMjAxIiB2aWV3Qm94PSIwIDAgNiA2IiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjojZmZmZmZmMDAiIHZlcnNpb249IjEuMSINCXhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiDQl4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjZweCIgaGVpZ2h0PSI2cHgiDT4NCTxnIG9wYWNpdHk9IjAuMzAyIj4NCQk8cGF0aCBkPSJNIDYgNiBMIDAgNiBMIDAgNC4yIEwgNCA0LjIgTCA0LjIgNC4yIEwgNC4yIDAgTCA2IDAgTCA2IDYgTCA2IDYgWiIgZmlsbD0iIzAwMDAwMCIvPg0JPC9nPg08L3N2Zz4=') no-repeat bottom right;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: se-resize;
}

.vue3-grid-item > .vue-rtl-resizable-handle {
  bottom: 0;
  left: 0;
  padding-left: 3px;
  background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAuMDAwMDAwMDAwMDAwMDAyIiBoZWlnaHQ9IjEwLjAwMDAwMDAwMDAwMDAwMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDwhLS0gQ3JlYXRlZCB3aXRoIE1ldGhvZCBEcmF3IC0gaHR0cDovL2dpdGh1Yi5jb20vZHVvcGl4ZWwvTWV0aG9kLURyYXcvIC0tPgogPGc+CiAgPHRpdGxlPmJhY2tncm91bmQ8L3RpdGxlPgogIDxyZWN0IGZpbGw9Im5vbmUiIGlkPSJjYW52YXNfYmFja2dyb3VuZCIgaGVpZ2h0PSIxMiIgd2lkdGg9IjEyIiB5PSItMSIgeD0iLTEiLz4KICA8ZyBkaXNwbGF5PSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgeT0iMCIgeD0iMCIgaGVpZ2h0PSIxMDAlIiB3aWR0aD0iMTAwJSIgaWQ9ImNhbnZhc0dyaWQiPgogICA8cmVjdCBmaWxsPSJ1cmwoI2dyaWRwYXR0ZXJuKSIgc3Ryb2tlLXdpZHRoPSIwIiB5PSIwIiB4PSIwIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+CiAgPC9nPgogPC9nPgogPGc+CiAgPHRpdGxlPkxheWVyIDE8L3RpdGxlPgogIDxsaW5lIGNhbnZhcz0iI2ZmZmZmZiIgY2FudmFzLW9wYWNpdHk9IjEiIHN0cm9rZS1saW5lY2FwPSJ1bmRlZmluZWQiIHN0cm9rZS1saW5lam9pbj0idW5kZWZpbmVkIiBpZD0ic3ZnXzEiIHkyPSItNzAuMTc4NDA3IiB4Mj0iMTI0LjQ2NDE3NSIgeTE9Ii0zOC4zOTI3MzciIHgxPSIxNDQuODIxMjg5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIi8+CiAgPGxpbmUgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2UtbGluZWNhcD0idW5kZWZpbmVkIiBzdHJva2UtbGluZWpvaW49InVuZGVmaW5lZCIgaWQ9InN2Z181IiB5Mj0iOS4xMDY5NTciIHgyPSIwLjk0NzI0NyIgeTE9Ii0wLjAxODEyOCIgeDE9IjAuOTQ3MjQ3IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KICA8bGluZSBzdHJva2UtbGluZWNhcD0idW5kZWZpbmVkIiBzdHJva2UtbGluZWpvaW49InVuZGVmaW5lZCIgaWQ9InN2Z183IiB5Mj0iOSIgeDI9IjEwLjA3MzUyOSIgeTE9IjkiIHgxPSItMC42NTU2NCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9IiM2NjY2NjYiIGZpbGw9Im5vbmUiLz4KIDwvZz4KPC9zdmc+) no-repeat bottom left;
  background-origin: content-box;
  cursor: sw-resize;
  right: auto;
}

.vue3-grid-item.disable-userselect {
  user-select: none;
}

</style>

