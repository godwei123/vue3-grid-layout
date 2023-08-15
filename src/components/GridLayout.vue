<template>
  <div ref="grid-layout" :style="mergeStyles" class="vue3-grid-layout">
    <slot></slot>
    <grid-item
        class="vue3-grid-placeholder"
        v-show="isDragging"
        :x="placeholder.x"
        :y="placeholder.y"
        :w="placeholder.w"
        :h="placeholder.h"
        :i="placeholder.i"
    ></grid-item>
  </div>
</template>

<script lang="ts" setup>
import {
  CSSProperties,
  getCurrentInstance,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch
} from "vue";
import GridItem from "./GridItem.vue";
import elementResizeDetectorMaker from "element-resize-detector"
import {Breakpoint, IGridItem, IGridLayout} from "../types";
import {addWindowEventListener, removeWindowEventListener} from "../utils/dom.ts";
import {emitter} from "../utils";
import {
  bottom,
  cloneLayout,
  compact,
  getAllCollisions,
  getLayoutItem,
  moveElement,
  validateLayout
} from '../utils/utils.ts';
import {
  findOrGenerateResponsiveLayout,
  getBreakpointFromWidth,
  getColsFromBreakpoint
} from "../utils/responsiveUtils.ts";

const props = withDefaults(defineProps<IGridLayout>(), {
  autoSize: true,
  colNum: 12,
  rowHeight: 150,
  maxRows: Infinity,
  isDraggable: true,
  isResizable: true,
  isMirrored: false,
  isBounded: false,
  verticalCompact: true,
  useCssTransforms: true,
  restoreOnDrag: false,
  responsive: false,
  responsiveLayouts: () => ({}),
  transformScale: 1,
  margin: () => ([10, 10]),
  breakpoints: () => ({lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}),
  cols: () => ({'lg': 12, "md": 10, "sm": 6, 'xs': 4, "xxs": 2}),
  preventCollision: false,
  useStyleCursor: true
})
const emit = defineEmits(['layout-created', 'layout-before-mount', 'layout-mounted',
  'layout-ready', 'layout-updated', 'breakpoint-changed'])

let width = ref<number>()
let mergeStyles = ref<CSSProperties>({})
let placeholder = ref<IGridItem>({
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  i: -1
})
let isDragging = ref(false)
let lastLayoutLength = ref(0)
let layoutRef = ref<HTMLElement | null>(null)
let lastBreakpoint = ref<Breakpoint | null>(null)
let layouts = ref()
let originalLayout = ref(null)
let layout = ref({})
let erd = ref<any>(null)
const resizeEvent = (eventName, id, x, y, h, w) => {
  let l = getLayoutItem(props.layout, id);
  //GetLayoutItem sometimes return null object
  if (l === undefined || l === null) {
    l = {h: 0, w: 0}
  }

  let hasCollisions;
  if (props.preventCollision) {
    const collisions = getAllCollisions(props.layout, {...l, w, h}).filter(
        layoutItem => layoutItem.i !== l.i
    );
    hasCollisions = collisions.length > 0;

    // If we're colliding, we need adjust the placeholder.
    if (hasCollisions) {
      // adjust w && h to maximum allowed space
      let leastX = Infinity,
          leastY = Infinity;
      collisions.forEach(layoutItem => {
        if (layoutItem.x > l.x) leastX = Math.min(leastX, layoutItem.x);
        if (layoutItem.y > l.y) leastY = Math.min(leastY, layoutItem.y);
      });

      if (Number.isFinite(leastX)) l.w = leastX - l.x;
      if (Number.isFinite(leastY)) l.h = leastY - l.y;
    }
  }

  if (!hasCollisions) {
    // Set new width and height.
    l.w = w;
    l.h = h;
  }

  if (eventName === "resizestart" || eventName === "resizemove") {
    placeholder.value.i = id;
    placeholder.value.x = x;
    placeholder.value.y = y;
    placeholder.value.w = l.w;
    placeholder.value.h = l.h;
    nextTick(function () {
      isDragging.value = true;
    });
    //this.$broadcast("updateWidth", this.width);
    emitter.emit("updateWidth", width.value);

  } else {
    nextTick(function () {
      isDragging.value = true;
    });
  }

  if (props.responsive) responsiveGridLayout();

  compact(props.layout, props.verticalCompact);
  emitter.emit("compact");
  updateHeight();

  if (eventName === 'resizeend') emit('layout-updated', props.layout);
}
const findDifference = (layout, originalLayout) => {
  //Find values that are in result1 but not in result2
  let uniqueResultOne = layout.filter(function (obj) {
    return !originalLayout.some(function (obj2) {
      return obj.i === obj2.i;
    });
  });

  //Find values that are in result2 but not in result1
  let uniqueResultTwo = originalLayout.filter(function (obj) {
    return !layout.some(function (obj2) {
      return obj.i === obj2.i;
    });
  });

  //Combine the two arrays of unique entries#
  return uniqueResultOne.concat(uniqueResultTwo);
}
const resizeEventHandler = (eventType, i, x, y, h, w) => {
  resizeEvent(eventType, i, x, y, h, w);
}
let positionsBeforeDrag = ref()
const dragEvent = (eventName, id, x, y, h, w) => {
  let l = getLayoutItem(layout.value, id);
  //GetLayoutItem sometimes returns null object
  if (l === undefined || l === null) {
    l = {x: 0, y: 0}
  }
  if (eventName === "dragstart" && !this.verticalCompact) {
    positionsBeforeDrag.value = layout.value.reduce((result, {i, x, y}) => ({
      ...result,
      [i]: {x, y}
    }), {});
  }

  if (eventName === "dragmove" || eventName === "dragstart") {
    placeholder.value.i = id;
    placeholder.value.x = l.x;
    placeholder.value.y = l.y;
    placeholder.value.w = w;
    placeholder.value.h = h;
    nextTick(() => {
      isDragging.value = true;
    });
    emitter.emit("updateWidth", width.value);
  } else {
    nextTick(() => {
      isDragging.value = true;
    });
  }
  layout.value = moveElement(layout.value, l, x, y, true, props.preventCollision);

  if (props.restoreOnDrag) {
    // Do not compact items more than in layout before drag
    // Set moved item as static to avoid to compact it
    l.static = true;
    compact(layout.value, props.verticalCompact, positionsBeforeDrag.value);
    l.static = false;
  } else {
    compact(layout.value, props.verticalCompact);
  }

  // needed because vue can't detect changes on array element properties
  emitter.emit("compact");
  updateHeight();
  if (eventName === 'dragend') {
    positionsBeforeDrag.value = null;
    emit('layout-updated', layout.value);
  }
}

const dragEventHandler = (eventType, i, x, y, h, w) => {
  dragEvent(eventType, i, x, y, h, w);
};

emitter.on('resizeEvent', resizeEventHandler);
emitter.on('dragEvent', dragEventHandler);

emit('layout-created', layout.value);

const onWindowResize = () => {
  if (layoutRef.value) {
    width.value = layoutRef.value.offsetWidth || 0;
  }
  emitter.emit('resizeEvent');
}

onBeforeUnmount(() => {
  emitter.off('resizeEvent', resizeEventHandler);
  emitter.off('dragEvent', dragEventHandler);
  removeWindowEventListener('resize', onWindowResize)
  if (layoutRef.value) {
    erd.value?.uninstall(layoutRef.value)
  }
})


onBeforeMount(() => {
  emit('layout-before-mount', layout.value)
})

const initResponsiveFeatures = () => {
  layouts.value = Object.assign({}, props.responsiveLayouts)
}

const containerHeight = () => {
  if (!props.autoSize) {
    return
  }
  return `${bottom(layout.value) * (props.rowHeight + props.margin[1]) + props.margin[1]}px`;
}

function updateHeight() {
  mergeStyles.value = {
    height: containerHeight()
  }
}

onMounted(() => {
  emit('layout-mounted', layout.value)
  validateLayout(layout.value)
  originalLayout.value = layout.value
  nextTick(() => {
    initResponsiveFeatures()
    onWindowResize()
    addWindowEventListener('resize', onWindowResize);
    compact(layout.value, props.verticalCompact);
    emit('layout-updated', layout.value)
    updateHeight();
    nextTick(() => {
      erd.value = elementResizeDetectorMaker({
        strategy: "scroll",
        callOnAdd: false,
      });
      erd.value.listenTo(layoutRef.value, () => {
        onWindowResize();
      });

    })
  })
})

watch(width, (newVal, oldVal) => {
  nextTick(() => {
    emitter.emit('updateWidth', width)
    if (oldVal == null) {
      nextTick(() => {
        emit('layout-ready', layout)
      })
    }
    updateHeight()
  })
})
const responsiveGridLayout = () => {
  let newBreakpoint = getBreakpointFromWidth(props.breakpoints, width.value);
  let newCols = getColsFromBreakpoint(newBreakpoint, cols.value);

  // save actual layout in layouts
  if (lastBreakpoint.value != null && !layouts.value[lastBreakpoint.value])
    ayouts.value[lastBreakpoint.value] = cloneLayout(props.layout);

  // Find or generate a new layout.
  let layout = findOrGenerateResponsiveLayout(
      originalLayout.value,
      layouts.value,
      props.breakpoints,
      newBreakpoint,
      lastBreakpoint.value,
      newCols,
      props.verticalCompact
  );

  // Store the new layout.
  layouts.value[newBreakpoint] = layout;

  if (lastBreakpoint.value !== newBreakpoint) {
    emit('breakpoint-changed', newBreakpoint, layout);
  }

  // new prop sync
  emit('update:layout', layout);

  lastBreakpoint.value = newBreakpoint;
  emitter.emit("setColNum", getColsFromBreakpoint(newBreakpoint, props.cols));
}

const layoutUpdate = () => {
  if (layout.value !== undefined && originalLayout.value !== null) {
    if (layout.value.length !== originalLayout.value.length) {
      let diff = findDifference(layout.value, originalLayout.value)
      if (diff.length > 0) {
        if (layout.value.length > originalLayout.value.length) {
          originalLayout.value = originalLayout.value.concat(diff)
        } else {
          originalLayout.value = originalLayout.value.filter(obj => {
            return !diff.some(item => obj.i === item.i)
          })
        }
      }
      lastLayoutLength.value = layout.value.length
      initResponsiveFeatures()
    }
    compact(layout.value, props.verticalCompact)
    emitter.emit('updateWidth', width.value)
    updateHeight()
    emit('layout-updated', layout.value)
  }

}

watch(layout, () => {
  layoutUpdate()
})

watch(() => props.colNum, (value) => {
  emitter.emit('setColNum', value)
})
watch(() => props.rowHeight, () => {
  emitter.emit('setRowHeight', props.rowHeight)
})
watch(() => props.isDraggable, () => {
  emitter.emit('setDraggable', props.isDraggable)
})
watch(() => props.isResizable, () => {
  emitter.emit('setResizeable', props.isResizable)
})
watch(() => props.isBounded, () => {
  emitter.emit('setBounded', props.isBounded)
})
watch(() => props.transformScale, () => {
  emitter.emit('setTransformScale', props.transformScale)
})
watch(() => props.responsive, () => {
  if (!props.responsive) {
    emit('update:layout', originalLayout.value)
    emitter.emit('setColNum', props.colNum)
  }
  onWindowResize()
})
watch(() => props.maxRows, () => {
  emitter.emit('setMaxRows', props.maxRows)
})
watch(() => props.margin, () => {
  updateHeight()
})


defineExpose({
  layoutRef
})

provide('layout', getCurrentInstance())


</script>

<style scoped>
.vue3-grid-layout {
  position: relative;
  transition: height 200ms ease;
}
</style>
