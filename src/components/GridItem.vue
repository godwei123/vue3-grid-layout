<template>
  <div ref="itemRef"
       class="vue3-grid-item"
       :class="classObj"
       :style="style"
  >
    <slot></slot>
    <span v-if="resizableAndNotStatic" ref="handle" :class="resizableHandleClass"></span>
  </div>
</template>

<script setup lang="ts">
import {ItemPropsType} from "../types";
import {computed, CSSProperties, inject, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {
  createCoreData,
  emitter,
  getColsFromBreakpoint,
  getControlPosition,
  getDocumentDir,
  setTopLeft,
  setTopRight,
  setTransform,
  setTransformRtl
} from "../utils";
import interact from 'interactjs'
import {Interactable} from "@interactjs/core/Interactable";

const itemRef = ref()

const props = withDefaults(defineProps<ItemPropsType>(), {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  isDraggable: false,
  isResizable: false,
  static: false,
  minH: 1,
  minW: 1,
  maxH: Infinity,
  maxW: Infinity,
  dragIgnoreFrom: 'a, button',
  resizeIgnoreFrom: 'a, button',
})

const emit = defineEmits<{
  'move': [i: string, x: number, y: number]
  'resize': [i: string, h: number, w: number, hpx: number, wpx: number]
  'moved': [i: string, x: number, y: number]
  'resized': [i: string, h: number, w: number, hpx: number, wpx: number]
  'containerResized': [i: string, h: number, w: number, hpx: number, wpx: number]
}>()

let cols = ref(1)
let containerWidth = ref(100)
let rowHeight = ref(30)
let margin = ref([10, 10])
let maxRows = ref(Infinity)
let draggable = ref(true)
let resizable = ref(true)
let transformScale = ref(1)
let useCssTransforms = ref(true)
let useStyleCursor = ref(true)
let isDragging = ref(false)
let dragging = ref<{
  top: number,
  left: number
}>()
let isResizing = ref(false)
let resizing = ref()
let lastW = ref(NaN);
let lastH = ref(NaN);
let lastX = ref(NaN);
let lastY = ref(NaN);
let style = ref<CSSProperties>({})
let rtl = ref<boolean>(getDocumentDir() === 'rtl')
let dragEventSet = ref<boolean>(false)
let resizeEventSet = ref<boolean>(false)
let previousW = ref<number>(0)
let previousH = ref<number>(0)
let previousX = ref<number>(0)
let previousY = ref<number>(0)
let innerX = ref(props.x)
let innerY = ref(props.y)
let innerW = ref(props.w)
let innerH = ref(props.h)
let bounded = ref<boolean>()
const layout = inject<Record<string, any>>('layout', {})

console.log('layout', layout)
const updateWidthHandler = (width: number) => {
  updateWidth(width)
}

const compactHandler = () => {
  compact();
};


const setDraggableHandler = (isDraggable: boolean) => {
  draggable.value = isDraggable;
}

const setResizableHandler = (isResizable: boolean) => {
  resizable.value = isResizable;
}

const setBoundedHandler = (isBounded: boolean | null) => {
  if (isBounded === null) {
    bounded.value = props.isBounded;
  }
};

const setTransformScaleHandler = (value: number) => {
  transformScale.value = value
};

const setRowHeightHandler = (value: number) => {
  rowHeight.value = value;
};

const setMaxRowsHandler = (value: number) => {
  maxRows.value = value;
};

const directionChangeHandler = () => {
  rtl.value = getDocumentDir() === 'rtl';
  compact();
};

const setColNumHandler = (colNum: string | number) => {
  if (typeof colNum === "string") {
    cols.value = parseInt(colNum);
  }
}


rtl.value = getDocumentDir() === 'rtl';
// --------------------------------------------


onMounted(() => {
  if (layout.responsive && layout.lastBreakpoint) {
    cols.value = getColsFromBreakpoint(layout.lastBreakpoint, layout.cols);
  } else {
    cols.value = layout.colNum;
  }
  rowHeight.value = layout.rowHeight;
  containerWidth.value = layout.width !== null ? layout.width : 100;
  margin.value = layout.margin !== undefined ? layout.margin : [10, 10];
  maxRows.value = layout.maxRows;

  if (props.isDraggable) {
    draggable.value = layout.isDraggable;
  } else {
    draggable.value = props.isDraggable;
  }
  if (props.isResizable) {
    resizable.value = layout.isResizable;
  } else {
    resizable.value = props.isResizable;
  }
  if (props.isBounded) {
    bounded.value = layout.isBounded;
  } else {
    bounded.value = props.isBounded;
  }
  transformScale.value = layout.transformScale
  useCssTransforms.value = layout.useCssTransforms;
  useStyleCursor.value = layout.useStyleCursor;
  createStyle();
})

// --------------------------------------------


emitter.on('setMargin', (value: [number, number]) => {
  if (!margin || (value[0] == margin.value[0] && value[1] == margin.value[1])) {
    return;
  }
  margin.value = value.map(m => Number(m));
  createStyle();
  emitContainerResized();
})


// --------------------------------------------

const classObj = computed(() => {
  return {
    'vue-resizable': resizableAndNotStatic,
    'static': props.static,
    'resizing': isResizing,
    'vue-draggable-dragging': isDragging,
    'cssTransforms': useCssTransforms,
    'render-rtl': renderRtl,
    'disable-userselect': isDragging,
    'no-touch': isAndroid.value && draggableOrResizableAndNotStatic
  }
})

const isAndroid = computed(() => {
  return navigator.userAgent.toLowerCase().indexOf("android") !== -1;
})

const resizableAndNotStatic = computed(() => {
  return resizable.value && props.static
})

const draggableOrResizableAndNotStatic = computed(() => {
  return (draggable.value || resizable.value) && !props.static;
})
const renderRtl = computed(() => {
  return (layout.isMirrored) ? !rtl : rtl;
})
const resizableHandleClass = computed<string>(() => {
  if (renderRtl.value) {
    return 'vue-resizable-handle vue-rtl-resizable-handle';
  } else {
    return 'vue-resizable-handle';
  }
})


// --------------------------------------------


const calcColWidth = (): number => {
  return (containerWidth.value - (margin.value[0] * (cols.value + 1))) / cols.value;
}

const calcXY = (top: number, left: number): {
  x: number,
  y: number
} => {
  const colWidth = calcColWidth()
  let x = Math.round((left - margin.value[0]) / (colWidth + margin.value[0]));
  let y = Math.round((top - margin.value[1]) / (rowHeight.value + margin.value[1]));
  x = Math.max(Math.min(x, cols.value - innerW.value), 0);
  y = Math.max(Math.min(y, maxRows.value - innerH.value), 0);
  return {x, y};
}

const calcWH = (height: number, width: number, autoSizeFlag = false) => {
  const colWidth = calcColWidth()
  let w = Math.round((width + margin.value[0]) / (colWidth + margin.value[0]));
  let h = 0;
  if (!autoSizeFlag) {
    h = Math.round((height + margin.value[1]) / (rowHeight.value + margin.value[1]));
  } else {
    h = Math.ceil((height + margin.value[1]) / (rowHeight.value + margin.value[1]));
  }
  w = Math.max(Math.min(w, cols.value - innerX.value), 0);
  h = Math.max(Math.min(h, maxRows.value - innerY.value), 0);
  return {w, h};
}

interface Position {
  top: number;
  width: number;
  height: number;
  right?: number;
  left?: number;
}

const calcPosition = (x: number, y: number, w: number, h: number): Position => {
  const colWidth = calcColWidth()
  return renderRtl.value ? {
    right: Math.round(colWidth * x + (x + 1) * margin.value[0]),
    top: Math.round(rowHeight.value * y + (y + 1) * margin.value[1]),
    width: w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * margin.value[0]),
    height: h === Infinity ? h : Math.round(rowHeight.value * h + Math.max(0, h - 1) * margin.value[1])
  } : {
    left: Math.round(colWidth * x + (x + 1) * margin.value[0]),
    top: Math.round(rowHeight.value * y + (y + 1) * margin.value[1]),
    width: w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * margin.value[0]),
    height: h === Infinity ? h : Math.round(rowHeight.value * h + Math.max(0, h - 1) * margin.value[1])
  }
}

//--------------------------------------
const createStyle = () => {
  if (props.x + props.w > cols.value) {
    innerX.value = 0;
    innerW.value = Math.min(props.w, cols.value)
  } else {
    innerX.value = props.x;
    innerW.value = props.w;
  }
  let pos = calcPosition(innerX.value, innerY.value, innerW.value, innerH.value);
  if (isDragging.value) {
    pos.top = dragging.value!.top;
    if (renderRtl.value) {
      pos.right = dragging.value!.left;
    } else {
      pos.left = dragging.value!.left;
    }
  }
  if (isResizing.value) {
    pos.width = resizing.value?.width;
    pos.height = resizing.value?.height;
  }
  if (useCssTransforms.value) {
    if (renderRtl.value) {
      style.value = setTransformRtl(pos.top, pos.right || 0, pos.width, pos.height);
    } else {
      style.value = setTransform(pos.top, pos.left || 0, pos.width, pos.height);
    }
  } else {
    if (renderRtl.value) {
      style.value = setTopRight(pos.top, pos.right || 0, pos.width, pos.height);
    } else {
      style.value = setTopLeft(pos.top, pos.left || 0, pos.width, pos.height);
    }
  }
}

const emitContainerResized = () => {
  let styleProps: {
    [key: string]: any
  } = {};
  for (let prop of ['width', 'height']) {
    let val = style.value[prop as 'width' | 'height'];
    let matches = String(val)?.match(/^(\d+)px$/);
    if (!matches)
      return;
    styleProps[prop] = matches[1];
  }
  emit("containerResized", props.i, props.h, props.w, styleProps.height, styleProps.width);
}

const compact = () => {
  createStyle();
}


//---------------------------------

const updateWidth = (width: number, colNum?: number) => {
  containerWidth.value = width;
  if (colNum) {
    cols.value = colNum;
  }
}

const clamp = (num: number, lowerBound: number, upperBound: number) => {
  return Math.max(Math.min(num, upperBound), lowerBound);
}
const calcGridItemWHPx = (gridUnits: number, colOrRowSize: number, marginPx: number) => {
  if (!Number.isFinite(gridUnits)) return gridUnits;
  return Math.round(
      colOrRowSize * gridUnits + Math.max(0, gridUnits - 1) * marginPx
  );
}

const handleResize = (event: Event) => {
  if (props.static) return;
  const position = getControlPosition(event);
  if (position === null) return;
  const {x, y} = position;

  const newSize = {width: 0, height: 0};
  let pos;
  switch (event.type) {
    case "resizestart": {
      tryMakeResizable()
      previousW.value = innerW.value;
      previousH.value = innerH.value;
      pos = calcPosition(innerX.value, innerY.value, innerW.value, innerH.value);
      newSize.width = pos.width;
      newSize.height = pos.height;
      resizing.value = newSize;
      isResizing.value = true;
      break;
    }
    case "resizemove": {
      const coreEvent = createCoreData(lastW.value, lastH.value, x, y);
      if (renderRtl.value) {
        newSize.width = resizing.value.width - coreEvent.deltaX / transformScale.value;
      } else {
        newSize.width = resizing.value.width + coreEvent.deltaX / transformScale.value;
      }
      newSize.height = resizing.value.height + coreEvent.deltaY / transformScale.value;

      resizing.value = newSize;
      break;
    }
    case "resizeend": {
      pos = calcPosition(innerX.value, innerY.value, innerW.value, innerH.value);
      newSize.width = pos.width;
      newSize.height = pos.height;
      resizing.value = null;
      isResizing.value = false;
      break;
    }
  }


  pos = calcWH(newSize.height, newSize.width);

  pos.w = Math.min(Math.max(pos.w, props.minW), props.maxW)
  pos.h = Math.min(Math.max(pos.h, props.minH), props.maxH)
  pos.w = Math.max(pos.w, 1)
  pos.h = Math.max(pos.h, 1)

  lastW.value = x;
  lastH.value = y;

  if (innerW.value !== pos.w || innerH.value !== pos.h) {
    emit('resize', props.i, pos.h, pos.w, newSize.height, newSize.width)
  }
  if (event.type === "resizeend" && (previousW.value !== innerW.value || previousH.value !== innerH.value)) {
    emit("resized", props.i, pos.h, pos.w, newSize.height, newSize.width);
  }
  emitter.emit("resizeEvent", {eventName: event.type, id: props.i, x: innerX.value, y: innerY.value, h: pos.h, w: pos.w});
}

const handleDrag = (event: any) => {
  if (props.static) return;
  if (isResizing.value) return;

  const position = getControlPosition(event);

  if (position === null) return;
  const {x, y} = position;

  let newPosition = {top: 0, left: 0};
  switch (event.type) {
    case "dragstart": {
      previousX.value = innerX.value;
      previousY.value = innerY.value;

      let parentRect = ((event.target as HTMLElement)?.offsetParent as HTMLElement).getBoundingClientRect();
      let clientRect = (event.target as HTMLElement).getBoundingClientRect();

      const cLeft = clientRect.left / transformScale.value;
      const pLeft = parentRect.left / transformScale.value;
      const cRight = clientRect.right / transformScale.value;
      const pRight = parentRect.right / transformScale.value;
      const cTop = clientRect.top / transformScale.value;
      const pTop = parentRect.top / transformScale.value;

      if (renderRtl.value) {
        newPosition.left = (cRight - pRight) * -1;
      } else {
        newPosition.left = cLeft - pLeft;
      }
      newPosition.top = cTop - pTop;
      dragging.value = newPosition;
      isDragging.value = true;
      break;
    }
    case "dragend": {
      if (!isDragging.value) return;
      let parentRect = ((event.target as HTMLElement)?.offsetParent as HTMLElement).getBoundingClientRect();
      let clientRect = (event.target as HTMLElement).getBoundingClientRect();

      const cLeft = clientRect.left / transformScale.value;
      const pLeft = parentRect.left / transformScale.value;
      const cRight = clientRect.right / transformScale.value;
      const pRight = parentRect.right / transformScale.value;
      const cTop = clientRect.top / transformScale.value;
      const pTop = parentRect.top / transformScale.value;

      if (renderRtl.value) {
        newPosition.left = (cRight - pRight) * -1;
      } else {
        newPosition.left = cLeft - pLeft;
      }
      newPosition.top = cTop - pTop;
      dragging.value = {left: 0, top: 0};
      isDragging.value = false;
      break;
    }
    case "dragmove": {
      const coreEvent = createCoreData(lastX.value, lastY.value, x, y);
      if (renderRtl.value) {
        newPosition.left = dragging.value!.left - coreEvent.deltaX / transformScale.value;
      } else {
        newPosition.left = dragging.value!.left + coreEvent.deltaX / transformScale.value;
      }
      newPosition.top = dragging.value!.top + coreEvent.deltaY / transformScale.value;
      if (bounded.value) {
        const bottomBoundary = ((event.target as HTMLElement)?.offsetParent as HTMLElement).clientHeight - calcGridItemWHPx(props.h, rowHeight.value, margin.value[1]);
        newPosition.top = clamp(newPosition.top, 0, bottomBoundary);
        const colWidth = calcColWidth();
        const rightBoundary = containerWidth.value - calcGridItemWHPx(props.w, colWidth, margin.value[0]);
        newPosition.left = clamp(newPosition.left, 0, rightBoundary);
      }
      dragging.value = newPosition;
      break;
    }
  }

  let pos;
  if (renderRtl.value) {
    pos = calcXY(newPosition.top, newPosition.left);
  } else {
    pos = calcXY(newPosition.top, newPosition.left);
  }

  lastX.value = x;
  lastY.value = y;

  if (innerX.value !== pos.x || innerY.value !== pos.y) {
    emit("move", props.i, pos.x, pos.y);
  }
  if (event.type === "dragend" && (previousX.value !== innerX.value || previousY.value !== innerY.value)) {
    emit("moved", props.i, pos.x, pos.y);
  }
  emitter.emit("dragEvent", {eventName: event.type, id: props.i, x: pos.x, y: pos.y, h: innerH.value, w: innerW.value});
}


let instance: Interactable;
const tryMakeDraggable = () => {
  if (!instance) {
    instance = interact(itemRef.value);
    instance.styleCursor(useStyleCursor.value);
  }
  if (draggable.value && !props.static) {
    const opts = {
      ignoreFrom: props.dragIgnoreFrom,
      allowFrom: props.dragAllowFrom,
      ...props.dragOption
    };
    instance.draggable(opts);
    if (!dragEventSet.value) {
      dragEventSet.value = true;
      instance.on(['dragstart', 'dragmove', 'dragend'], (event) => {
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
    instance = interact(itemRef.value);
    instance.styleCursor(useStyleCursor.value);
  }
  if (resizable.value && !props.static) {
    let maximum = calcPosition(0, 0, props.maxW, props.maxH);
    let minimum = calcPosition(0, 0, props.minW, props.minH);
    const opts = {
      edges: {
        left: false,
        right: "." + resizableHandleClass.value.trim().replace(" ", "."),
        bottom: "." + resizableHandleClass.value.trim().replace(" ", "."),
        top: false
      },
      ignoreFrom: props.resizeIgnoreFrom,
      restrictSize: {
        min: {
          height: minimum.height * transformScale.value,
          width: minimum.width * transformScale.value
        },
        max: {
          height: maximum.height * transformScale.value,
          width: maximum.width * transformScale.value
        }
      },
      ...props.resizeOption,
    };

    if (props.preserveAspectRatio) {
      opts.modifiers = [
        interact.modifiers.aspectRatio({
          ratio: 'preserve'
        }),
      ]
    }
    instance.resizable(opts);
    if (!resizeEventSet.value) {
      resizeEventSet.value = true;
      instance.on(['resizestart', 'resizemove', 'resizeend'], (event) => {
        handleResize(event);
      });
    }
  } else {
    instance.resizable({
      enabled: false
    });
  }
}


watch(() => props.isDraggable, () => draggable.value = props.isDraggable)
watch(() => props.static, () => {
  tryMakeDraggable();
  tryMakeResizable();
})
watch(draggable, () => tryMakeDraggable())
watch(resizable, () => tryMakeResizable())
watch(() => props.isResizable, () => resizable.value = props.isResizable)
watch(() => props.isBounded, () => {
  bounded.value = props.isBounded
})
watch(rowHeight, () => {
  createStyle();
  emitContainerResized();
})
watch(cols, () => {
  tryMakeResizable();
  createStyle();
  emitContainerResized();
})
watch(containerWidth, () => {
  tryMakeResizable();
  createStyle();
  emitContainerResized();
})

watch(() => props.x, (value) => {
  innerX.value = value;
  createStyle();
})
watch(() => props.y, (value) => {
  innerY.value = value;
  createStyle();
})
watch(() => props.h, (value) => {
  innerH.value = value;
  createStyle();
})
watch(() => props.w, (value) => {
  innerW.value = value;
  createStyle();
})

watch([() => props.minH, () => props.maxH, () => props.minW, () => props.maxW], () => {
  tryMakeResizable();
})

watch(() => renderRtl.value, () => {
  tryMakeResizable();
  createStyle();
})

emitter.on('updateWidth', updateWidthHandler)
emitter.on('compact', compactHandler);
emitter.on('setDraggable', setDraggableHandler);
emitter.on('setResizable', setResizableHandler);
emitter.on('setRowHeight', setRowHeightHandler);
emitter.on('setMaxRows', setMaxRowsHandler);
emitter.on('directionChange', directionChangeHandler);
emitter.on('setColNum', setColNumHandler)
emitter.on('setBounded', setBoundedHandler);
emitter.on('setTransformScale', setTransformScaleHandler)

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

