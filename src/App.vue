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
        :use-css-transforms="true"
        :responsive="state.responsive"
        :transformScale="state.transformScale"
        @layout-updated="layoutUpdatedEvent"
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
          @moved="moved"
        >
          <span>{{ item.i }}</span>
        </grid-item>
      </grid-layout>
    </div>
  </main>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { GridItem, GridLayout } from '../packages'

const testLayout = [
  { x: 0, y: 0, w: 2, h: 4, i: '1' },
  { x: 3, y: 0, w: 2, h: 5, i: '2', static: true }
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
  rowHeight: 30,
  colNum: 12,
  index: 0,
  marginX: 10,
  marginY: 10
})

onMounted(() => {
  state.index = state.layout.length
})

function moved(i, newX, newY) {
  console.log(`### MOVED i=${i}, X=${newX}, Y=${newY}`)
}

function layoutUpdatedEvent(newLayout) {
  console.log('Updated layout: ', newLayout)
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
