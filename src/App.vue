<template>
  <header>
    <h1>Vue3-Grid-Layout</h1>
  </header>
  <main>
    <div>
      <div class="layoutJSON">
        Displayed as <code>[x, y, w, h]</code>:
        <div class="columns">
          <div class="layoutItem" v-for="item in state.layout" :key="item.i">
            <b>{{ item.i }}</b
            >: [{{ item.x }}, {{ item.y }}, {{ item.w }}, {{ item.h }}]
          </div>
        </div>
      </div>
    </div>
    <div id="content">
      <button @click="decreaseWidth">Decrease Width</button>
      <button @click="increaseWidth">Increase Width</button>
      <button @click="scaleHalf">Scale x0.5</button>
      <button @click="scaleThreeQuarters">Scale x0.75</button>
      <button @click="scaleIdentity">Scale x1.0</button>
      <button @click="addItem">Add an item</button>
      <button @click="addItemDynamically">Add an item dynamically</button>
      <!-- Add to show rtl support -->
      <button @click="changeDirection">Change Direction</button>
      <input type="checkbox" v-model="state.draggable" /> Draggable
      <input type="checkbox" v-model="state.resizable" /> Resizable
      <input type="checkbox" v-model="state.mirrored" /> Mirrored
      <input type="checkbox" v-model="state.bounded" /> Bounded
      <input type="checkbox" v-model="state.responsive" /> Responsive
      <input type="checkbox" v-model="state.preventCollision" /> Prevent Collision
      <input type="checkbox" v-model="state.compact" /> Vertical Compact
      <div style="margin-top: 10px; margin-bottom: 10px">
        Row Height: <input type="number" v-model="state.rowHeight" /> Col nums:
        <input type="number" v-model="state.colNum" /> Margin x:
        <input type="number" v-model="state.marginX" /> Margin y:
        <input type="number" v-model="state.marginY" />
      </div>
      <grid-layout
        id="grid-layout"
        class="grid"
        :margin="[parseInt(state.marginX), parseInt(state.marginY)]"
        v-model:layout="state.layout"
        :col-num="parseInt(state.colNum)"
        :row-height="state.rowHeight"
        :is-draggable="state.draggable"
        :is-resizable="state.resizable"
        :is-mirrored="state.mirrored"
        :is-bounded="state.bounded"
        :prevent-collision="state.preventCollision"
        :vertical-compact="state.compact"
        :restore-on-drag="state.restoreOnDrag"
        :use-css-transforms="true"
        :responsive="state.responsive"
        :transformScale="state.transformScale"
        @layout-created="layoutCreatedEvent"
        @layout-before-mount="layoutBeforeMountEvent"
        @layout-mounted="layoutMountedEvent"
        @layout-ready="layoutReadyEvent"
        @layout-updated="layoutUpdatedEvent"
        @breakpoint-changed="breakpointChangedEvent"
      >
        <grid-item
          v-for="item in state.layout"
          :key="item.i"
          :static="item.static"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :i="item.i"
          :min-w="item.minW"
          :max-w="item.maxW"
          :min-x="item.minX"
          :max-x="item.maxX"
          :min-y="item.minY"
          :max-y="item.maxY"
          :preserve-aspect-ratio="item.preserveAspectRatio"
          @resize="resize"
          @move="move"
          @resized="resized"
          @container-resized="containerResized"
          @moved="moved"
        >
          <!--<custom-drag-element :text="item.i"></custom-drag-element>-->
          <span :text="item.i" @removeItem="removeItem($event)">{{ item.i }}</span>
        </grid-item>
      </grid-layout>
    </div>
  </main>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { getDocumentDir, setDocumentDir } from '../packages/utils'
import { GridItem, GridLayout } from '../packages'

const testLayout = [
  {
    x: 0,
    y: 0,
    w: 2,
    h: 2,
    i: '0',
    resizable: true,
    draggable: true,
    static: false,
    minY: 0,
    maxY: 2
  },
  { x: 2, y: 0, w: 2, h: 4, i: '1', resizable: null, draggable: null, static: true },
  {
    x: 4,
    y: 0,
    w: 2,
    h: 5,
    i: '2',
    resizable: false,
    draggable: false,
    static: false,
    minX: 4,
    maxX: 4,
    minW: 2,
    maxW: 2,
    preserveAspectRatio: true
  },
  {
    x: 6,
    y: 0,
    w: 2,
    h: 3,
    i: '3',
    resizable: false,
    draggable: false,
    static: false,
    preserveAspectRatio: true
  },
  { x: 8, y: 0, w: 2, h: 3, i: '4', resizable: false, draggable: false, static: false },
  { x: 10, y: 4, w: 2, h: 4, i: '6', resizable: false, draggable: false, static: false, minY: 4 }
]

const state = reactive({
  layout: JSON.parse(JSON.stringify(testLayout)),
  layout2: JSON.parse(JSON.stringify(testLayout)),
  draggable: true,
  resizable: true,
  mirrored: false,
  responsive: false,
  bounded: false,
  transformScale: 1,
  preventCollision: false,
  compact: true,
  restoreOnDrag: true,
  rowHeight: 30,
  colNum: 12,
  index: 0,
  marginX: 10,
  marginY: 10
})

onMounted(() => {
  state.index = state.layout.length
})

// function clicked()  {
//   window.alert("CLICK!");
// }

function increaseWidth() {
  let width = document.getElementById('content').offsetWidth
  width += 20
  document.getElementById('content').style.width = `${width}px`
}

function decreaseWidth() {
  let width = document.getElementById('content').offsetWidth
  width -= 20
  document.getElementById('content').style.width = `${width}px`
}

function scaleHalf() {
  state.transformScale = 0.5
  document.getElementById('grid-layout').style.transform = 'scale(0.5)'
}

function scaleThreeQuarters() {
  state.transformScale = 0.75
  document.getElementById('grid-layout').style.transform = 'scale(0.75)'
}

function scaleIdentity() {
  state.transformScale = 1
  document.getElementById('grid-layout').style.transform = 'scale(1)'
}

function removeItem(i) {
  console.log(`### REMOVE ${i}`)
  const index = state.layout.map((item) => item.i).indexOf(i)
  state.layout.splice(index, 1)
}

function addItem() {
  // let self = state;
  // console.log("### LENGTH: " + state.layout.length);
  const item = { x: 0, y: 0, w: 2, h: 2, i: `${state.index}`, whatever: 'bbb' }
  state.index++
  state.layout.push(item)
}

function addItemDynamically() {
  const x = (state.layout.length * 2) % (state.colNum || 12)
  const y = state.layout.length + (state.colNum || 12)
  console.log(`X=${x} Y=${y}`)
  const item = {
    x,
    y,
    w: 2,
    h: 2,
    i: `${state.index}`
  }
  state.index++
  state.layout.push(item)
}

function move(i, newX, newY) {
  console.log(`MOVE i=${i}, X=${newX}, Y=${newY}`)
}

function resize(i, newH, newW, newHPx, newWPx) {
  console.log(`RESIZE i=${i}, H=${newH}, W=${newW}, H(px)=${newHPx}, W(px)=${newWPx}`)
}

function moved(i, newX, newY) {
  console.log(`### MOVED i=${i}, X=${newX}, Y=${newY}`)
}

function resized(i, newH, newW, newHPx, newWPx) {
  console.log(`### RESIZED i=${i}, H=${newH}, W=${newW}, H(px)=${newHPx}, W(px)=${newWPx}`)
}

function containerResized(i, newH, newW, newHPx, newWPx) {
  console.log(
    `### CONTAINER RESIZED i=${i}, H=${newH}, W=${newW}, H(px)=${newHPx}, W(px)=${newWPx}`
  )
}

/**
 * Add change direction button
 */
function changeDirection() {
  const documentDirection = getDocumentDir()
  let toggle = ''
  if (documentDirection === 'rtl') {
    toggle = 'ltr'
  } else {
    toggle = 'rtl'
  }
  setDocumentDir(toggle)
  // eventBus.$emit('directionchange');
}

function layoutCreatedEvent(newLayout) {
  console.log('Created layout: ', newLayout)
}

function layoutBeforeMountEvent(newLayout) {
  console.log('beforeMount layout: ', newLayout)
}

function layoutMountedEvent(newLayout) {
  console.log('Mounted layout: ', newLayout)
}

function layoutReadyEvent(newLayout) {
  console.log('Ready layout: ', newLayout)
}

function layoutUpdatedEvent(newLayout) {
  console.log('Updated layout: ', newLayout)
}

function breakpointChangedEvent(newBreakpoint, newLayout) {
  console.log('breakpoint changed breakpoint=', newBreakpoint, ', layout: ', newLayout)
}
</script>

<style>
/*** EXAMPLE ***/
#content {
  width: 100%;
  margin-top: 10px;
}

.vue3-grid-layout {
  background: #eee;
}

.layoutJSON {
  background: #ddd;
  border: 1px solid black;
  margin-top: 10px;
  padding: 10px;
}

.eventsJSON {
  background: #ddd;
  border: 1px solid black;
  margin-top: 10px;
  padding: 10px;
  height: 100px;
  overflow-y: scroll;
}

.columns {
  -moz-columns: 120px;
  -webkit-columns: 120px;
  columns: 120px;
}

.vue-resizable-handle {
  z-index: 5000;
  position: absolute;
  width: 20px;
  height: 20px;
  bottom: 0;
  right: 0;
  background: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg08IS0tIEdlbmVyYXRvcjogQWRvYmUgRmlyZXdvcmtzIENTNiwgRXhwb3J0IFNWRyBFeHRlbnNpb24gYnkgQWFyb24gQmVhbGwgKGh0dHA6Ly9maXJld29ya3MuYWJlYWxsLmNvbSkgLiBWZXJzaW9uOiAwLjYuMSAgLS0+DTwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DTxzdmcgaWQ9IlVudGl0bGVkLVBhZ2UlMjAxIiB2aWV3Qm94PSIwIDAgNiA2IiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjojZmZmZmZmMDAiIHZlcnNpb249IjEuMSINCXhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiDQl4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjZweCIgaGVpZ2h0PSI2cHgiDT4NCTxnIG9wYWNpdHk9IjAuMzAyIj4NCQk8cGF0aCBkPSJNIDYgNiBMIDAgNiBMIDAgNC4yIEwgNCA0LjIgTCA0LjIgNC4yIEwgNC4yIDAgTCA2IDAgTCA2IDYgTCA2IDYgWiIgZmlsbD0iIzAwMDAwMCIvPg0JPC9nPg08L3N2Zz4=');
  background-position: bottom right;
  padding: 0 3px 3px 0;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: se-resize;
}

.vue3-grid-item:not(.vue3-grid-placeholder) {
  background: #ccc;
  border: 1px solid black;
}

.vue3-grid-item.resizing {
  opacity: 0.9;
}

.vue3-grid-item.static {
  background: #cce;
}

.vue3-grid-item .text {
  font-size: 24px;
  text-align: center;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  height: 100%;
  width: 100%;
}

.vue3-grid-item .no-drag {
  height: 100%;
  width: 100%;
}

.vue3-grid-item .minMax {
  font-size: 12px;
}

.vue3-grid-item .add {
  cursor: pointer;
}

.vue3-draggable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  top: 0;
  left: 0;
  padding: 0 8px 8px 0;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><circle cx='5' cy='5' r='5' fill='#999999'/></svg>")
    no-repeat bottom right;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: pointer;
}

#content .vue3-grid-item.vue3-grid-placeholder {
  background-color: green;
}

.grid::before {
  content: '';
  background-size: calc(calc(100% - 5px) / 12) 40px;
  background-image: linear-gradient(to right, lightgrey 1px, transparent 1px),
    linear-gradient(to bottom, lightgrey 1px, transparent 1px);
  height: calc(100% - 5px);
  width: calc(100% - 5px);
  /*height: 100%;*/
  /*width: 100%;*/
  position: absolute;
  background-repeat: repeat;
  margin: 5px;
}
</style>
