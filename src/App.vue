<template>
  <div>
    <grid-layout
        :col-num="12"
        :is-draggable="true"
        :is-mirrored="false"
        :is-resizable="true"
        :layout="layout"
        :margin="[10, 10]"
        :row-height="30"
        :use-css-transforms="true"
        :vertical-compact="true"
        @layout-created="layoutCreatedEvent"
        @layout-before-mount="layoutBeforeMountEvent"
        @layout-mounted="layoutMountedEvent"
        @layout-ready="layoutReadyEvent"
        @layout-updated="layoutUpdatedEvent"
        @breakpoint-changed="breakpointChangedEvent"
    >

      <grid-item v-for="item in layout"
                 :key="item.i"
                 :h="item.h"
                 :i="item.i"
                 :w="item.w"
                 :x="item.x"
                 :y="item.y" col-num="5">
        {{ item.i }}
      </grid-item>
    </grid-layout>
  </div>
</template>

<script lang="ts" setup>

import GridLayout from "./components/GridLayout.vue";
import GridItem from "./components/GridItem.vue";

const layoutCreatedEvent = () => {
  console.log('layoutCreatedEvent')
}
const layoutBeforeMountEvent = () => {
  console.log('layoutBeforeMountEvent')
}
const layoutMountedEvent = () => {
  console.log('layoutMountedEvent')
}
const layoutReadyEvent = () => {
  console.log('layoutReadyEvent')
}
const layoutUpdatedEvent = () => {
  console.log('layoutUpdatedEvent')
}
const breakpointChangedEvent = () => {
  console.log('breakpointChangedEvent')
}

const layout = [
  {"x": 0, "y": 0, "w": 2, "h": 2, "i": "0"},
  {"x": 2, "y": 0, "w": 2, "h": 4, "i": "1"},
  {"x": 4, "y": 0, "w": 2, "h": 5, "i": "2"},
  {"x": 6, "y": 0, "w": 2, "h": 3, "i": "3"},
  {"x": 8, "y": 0, "w": 2, "h": 3, "i": "4"},
  {"x": 10, "y": 0, "w": 2, "h": 3, "i": "5"},
  {"x": 0, "y": 5, "w": 2, "h": 5, "i": "6"},
  {"x": 2, "y": 5, "w": 2, "h": 5, "i": "7"},
  {"x": 4, "y": 5, "w": 2, "h": 5, "i": "8"},
  {"x": 6, "y": 3, "w": 2, "h": 4, "i": "9"},
  {"x": 8, "y": 4, "w": 2, "h": 4, "i": "10"},
  {"x": 10, "y": 4, "w": 2, "h": 4, "i": "11"},
  {"x": 0, "y": 10, "w": 2, "h": 5, "i": "12"},
  {"x": 2, "y": 10, "w": 2, "h": 5, "i": "13"},
  {"x": 4, "y": 8, "w": 2, "h": 4, "i": "14"},
  {"x": 6, "y": 8, "w": 2, "h": 4, "i": "15"},
  {"x": 8, "y": 10, "w": 2, "h": 5, "i": "16"},
  {"x": 10, "y": 4, "w": 2, "h": 2, "i": "17"},
  {"x": 0, "y": 9, "w": 2, "h": 3, "i": "18"},
  {"x": 2, "y": 6, "w": 2, "h": 2, "i": "19"}
]

</script>

<style scoped>

</style>
