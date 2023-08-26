<template>
  <div ref="layoutRef" :style="mergeStyles" class="vue3-grid-layout">
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
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  provide,
  reactive,
  ref,
  toRefs,
  watch
} from 'vue'
import GridItem from './GridItem.vue'
import elementResizeDetectorMaker, { Erd } from 'element-resize-detector'
import {
  Events,
  IGridItem,
  Layout,
  LayoutPropType,
  LayoutState,
  Point,
  ResponsiveLayout
} from './types'
import {
  addWindowEventListener,
  bottom,
  cloneDeep,
  cloneLayout,
  compact,
  findDifference,
  findOrGenerateResponsiveLayout,
  getAllCollisions,
  getBreakpointFromWidth,
  getColsFromBreakpoint,
  getLayoutItem,
  moveElement,
  removeWindowEventListener,
  validateLayout
} from './utils'
import { useDebounce } from './utils/hooks.ts'
import mitt from 'mitt'

const emitter = mitt<Events>()

const props = withDefaults(defineProps<LayoutPropType>(), {
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
  margin: () => [10, 10],
  breakpoints: () => ({ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }),
  cols: () => ({ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }),
  preventCollision: false,
  useStyleCursor: true
})
const emit = defineEmits<{
  'layout-created': [layout: Layout]
  'layout-before-mount': [layout: Layout]
  'layout-mounted': [layout: Layout]
  'layout-ready': [layout: Layout]
  'layout-updated': [layout: Layout]
  'breakpoint-changed': [breakpoint: string, layout: Layout]
  'update:layout': [layout: Layout]
}>()

let erd: Erd
let positionsBeforeDrag: { [key: number]: Point }
let layoutRef = ref<HTMLElement | null>(null)

const state = reactive<LayoutState>({
  width: 0,
  mergeStyles: {},
  lastLayoutLength: 0,
  isDragging: false,
  placeholder: {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    i: -1
  },
  layouts: {} as ResponsiveLayout,
  lastBreakpoint: null,
  originalLayout: null
})

provide('layout', { ...props, ...state })
provide('emitter', emitter)

const onWindowResize = useDebounce(() => {
  if (layoutRef.value) {
    state.width = (layoutRef.value as HTMLElement).offsetWidth
  }
  emitter.emit('resizeEvent')
}, 100)

const initResponsiveFeatures = () => {
  state.layouts = cloneDeep(props.responsiveLayouts)
}

const containerHeight = () => {
  if (!props.autoSize) return
  const [, m2] = props.margin
  return `${bottom(props.layout) * (props.rowHeight + m2) + m2}px`
}

const updateHeight = () => {
  state.mergeStyles = { height: containerHeight() }
}

const responsiveGridLayout = () => {
  const newBreakpoint = getBreakpointFromWidth(props.breakpoints, state.width)
  if (!newBreakpoint) return
  const newCols = getColsFromBreakpoint(newBreakpoint, props.cols)
  if (state.lastBreakpoint != null && !state.layouts[state.lastBreakpoint])
    state.layouts[state.lastBreakpoint] = cloneLayout(props.layout)

  const layout = findOrGenerateResponsiveLayout(
    state.originalLayout as Layout,
    state.layouts,
    props.breakpoints,
    newBreakpoint,
    newCols,
    props.verticalCompact
  )
  state.layouts[newBreakpoint] = layout

  if (state.lastBreakpoint !== newBreakpoint) {
    emit('breakpoint-changed', newBreakpoint, layout)
  }

  emit('update:layout', layout)

  state.lastBreakpoint = newBreakpoint
  emitter.emit('setColNum', getColsFromBreakpoint(newBreakpoint, props.cols))
}

const layoutUpdate = () => {
  if (props.layout && state.originalLayout) {
    if (props.layout.length !== state.originalLayout.length) {
      const diff = findDifference(props.layout, state.originalLayout)
      if (diff.length > 0) {
        if (props.layout.length > state.originalLayout.length) {
          state.originalLayout = state.originalLayout.concat(diff)
        } else {
          state.originalLayout = state.originalLayout.filter((obj) => {
            return !diff.some((item) => obj.i === item.i)
          })
        }
      }
      state.lastLayoutLength = props.layout.length
      initResponsiveFeatures()
    }
    compact(props.layout, props.verticalCompact)
    emitter.emit('updateWidth', state.width)
    updateHeight()
    emit('layout-updated', props.layout)
    emit('update:layout', props.layout)
  }
}

watch(
  () => state.width,
  async (_, oldValue) => {
    await nextTick()
    emitter.emit('updateWidth', state.width)
    if (oldValue === null) {
      await nextTick(() => {
        emit('layout-ready', props.layout)
      })
    }
    updateHeight()
  }
)
watch(
  () => props.layout,
  () => layoutUpdate()
)
watch(
  () => props.colNum,
  (value) => emitter.emit('setColNum', value)
)
watch(
  () => props.rowHeight,
  () => emitter.emit('setRowHeight', props.rowHeight)
)
watch(
  () => props.isDraggable,
  () => emitter.emit('setDraggable', props.isDraggable)
)
watch(
  () => props.isResizable,
  () => emitter.emit('setResizeable', props.isResizable)
)
watch(
  () => props.isBounded,
  () => emitter.emit('setBounded', props.isBounded)
)
watch(
  () => props.transformScale,
  () => emitter.emit('setTransformScale', props.transformScale)
)
watch(
  () => props.responsive,
  () => {
    if (!props.responsive && state.originalLayout) {
      emit('update:layout', state.originalLayout)
      emitter.emit('setColNum', props.colNum)
    }
    onWindowResize()
  }
)
watch(
  () => props.maxRows,
  () => emitter.emit('setMaxRows', props.maxRows)
)
watch(
  () => props.margin,
  () => updateHeight()
)

const resizeEventHandler = (
  params: [string, string | number | symbol, number, number, number, number] | undefined
) => {
  if (params === undefined) return
  const [eventName, id, x, y, h, w] = params
  let l: any
  l = getLayoutItem(props.layout, id)
  if (l === undefined || l === null) {
    l = { h: 0, w: 0 }
  }
  let hasCollisions
  if (props.preventCollision) {
    const collisions = getAllCollisions(props.layout, { ...l, w, h }).filter(
      (layoutItem) => layoutItem.i !== l.i
    )
    hasCollisions = collisions.length > 0

    if (hasCollisions) {
      let leastX = Infinity,
        leastY = Infinity
      collisions.forEach((layoutItem) => {
        if (layoutItem.x > l.x) leastX = Math.min(leastX, layoutItem.x)
        if (layoutItem.y > l.y) leastY = Math.min(leastY, layoutItem.y)
      })

      if (Number.isFinite(leastX)) l.w = leastX - l.x
      if (Number.isFinite(leastY)) l.h = leastY - l.y
    }
  }

  if (!hasCollisions) {
    l.w = w
    l.h = h
  }

  if (eventName === 'resizestart' || eventName === 'resizemove') {
    state.placeholder.i = id
    state.placeholder.x = x
    state.placeholder.y = y
    state.placeholder.w = l.w
    state.placeholder.h = l.h
    nextTick(function () {
      state.isDragging = true
    })
    emitter.emit('updateWidth', state.width)
  } else {
    nextTick(function () {
      state.isDragging = false
    })
  }

  if (props.responsive) responsiveGridLayout()

  compact(props.layout, props.verticalCompact)
  emitter.emit('compact')
  updateHeight()

  if (eventName === 'resizeend') {
    emit('layout-updated', props.layout)
    emit('update:layout', props.layout)
  }
}

const dragEventHandler = (
  params?: [string, string | number | symbol, number, number, number, number]
) => {
  if (params === undefined) return
  const [eventName, id, x, y, h, w] = params
  let l = getLayoutItem(props.layout, id) || ({ x: 0, y: 0 } as IGridItem)
  if (eventName === 'dragstart' && !props.verticalCompact) {
    positionsBeforeDrag = props.layout.reduce(
      (result, { i, x, y }) => ({
        ...result,
        [i]: { x, y }
      }),
      {}
    )
  }

  if (eventName === 'dragmove' || eventName === 'dragstart') {
    state.placeholder.i = id
    state.placeholder.x = l.x
    state.placeholder.y = l.y
    state.placeholder.w = w
    state.placeholder.h = h
    nextTick(() => {
      state.isDragging = true
    })
    emitter.emit('updateWidth', state.width)
  } else {
    nextTick(() => {
      state.isDragging = false
    })
  }
  const newLayout = moveElement(props.layout, l, true, x, y, props.preventCollision)
  emit('update:layout', newLayout)
  if (props.restoreOnDrag) {
    l.static = true
    compact(newLayout, props.verticalCompact, positionsBeforeDrag)
    l.static = false
  } else {
    compact(newLayout, props.verticalCompact)
  }

  // needed because vue can't detect changes on array element properties
  emitter.emit('compact')
  updateHeight()
  if (eventName === 'dragend') {
    positionsBeforeDrag = {}
    emit('layout-updated', newLayout)
    emit('update:layout', newLayout)
  }
}

emitter.on('resizeEvent', resizeEventHandler)
emitter.on('dragEvent', dragEventHandler)
emit('layout-created', props.layout)

onBeforeMount(() => {
  emit('layout-before-mount', props.layout)
})

onMounted(async () => {
  emit('layout-mounted', props.layout)
  await nextTick()
  validateLayout(props.layout)
  state.originalLayout = props.layout as Layout
  await nextTick()
  initResponsiveFeatures()
  onWindowResize()
  addWindowEventListener('resize', onWindowResize)
  compact(props.layout, props.verticalCompact)
  emit('layout-updated', props.layout)
  emit('update:layout', props.layout)
  updateHeight()
  await nextTick()
  erd = elementResizeDetectorMaker({
    strategy: 'scroll',
    callOnAdd: false
  })
  erd.listenTo(<HTMLElement>layoutRef.value, () => {
    onWindowResize()
  })
})
onBeforeUnmount(() => {
  emitter.off('resizeEvent', resizeEventHandler)
  emitter.off('dragEvent', dragEventHandler)
  removeWindowEventListener('resize', onWindowResize)
  if (erd && layoutRef.value !== null) {
    erd.uninstall(<HTMLElement>layoutRef.value)
  }
})

defineExpose({})

const { mergeStyles, isDragging, placeholder } = toRefs(state)
</script>

<style scoped>
.vue3-grid-layout {
  position: relative;
  transition: height 200ms ease;
}
</style>
