<!-- eslint-disable max-lines-per-function -->
<!-- eslint-disable max-lines-per-function -->
<!-- JounalsAiMindmap -->
<template>
  <div ref="wrap" class="jounals-ai-mindmap">
    <div id="container"></div>
    <!-- toolbar -->
    <div></div>
  </div>
</template>

<script lang="ts" setup>
import { defineExpose, onMounted, defineOptions, ref } from 'vue'
import {
  Graph,
  treeToGraphData,
  GraphEvent,
  ExtensionCategory,
  register
} from '@antv/g6'
import { useResizeObserver } from '@vueuse/core'
import { MockDataPure } from './data'
import {
  getNodeWidth,
  getDirection,
  getColor,
  NodeStyle,
  RootNodeStyle,
  MindmapNode,
  MindmapEdge,
  CollapseExpandTree
} from './mindmap'

defineOptions({
  name: 'VueMindmapDemo'
})

const graph = ref<Graph>()

const graphData = ref(MockDataPure[0])

const wrap = ref()

const layout = () => ({
  type: 'mindmap',
  direction: 'H',
  getHeight: () => 16,
  getWidth: (node) => getNodeWidth(node.name, graphData.value.id === node.id),
  getVGap: () => 10,
  getHGap: () => 60,
  getSide: (node) => getDirection(graph.value!, node.id)
})
const edge = () => ({
  type: 'mindmap',
  style: {
    lineWidth: 2,
    sourcePort: (d) => {
      if (d.source === graphData.value.id) return undefined
      const direction = getDirection(graph.value!, d.target)
      return direction === 'right' ? 'right-bottom' : 'left-bottom'
    },
    targetPort: (d) => {
      const direction = getDirection(graph.value!, d.target)
      return direction === 'right' ? 'left-bottom' : 'right-bottom'
    },
    stroke: (d) => {
      return getColor(graph.value!, d.target)
    }
  }
})

const node = () => ({
  type: 'mindmap',
  style: (d) => {
    const direction = getDirection(graph.value!, d.id)
    const labelPadding = direction === 'right' ? [2, 40, 10, 0] : [2, 0, 10, 40]
    const isRoot = d.id === graphData.value.id
    return isRoot
      ? {
          color: getColor(graph.value!, d.id),
          direction,
          labelText: d.name,
          size: [getNodeWidth(d.name, isRoot), 30],
          labelBackground: true,
          labelBackgroundFill: 'transparent',
          labelPadding,
          ...RootNodeStyle
        }
      : {
          color: getColor(graph.value!, d.id),
          direction,
          labelText: d.name,
          size: [getNodeWidth(d.name, false), 30],
          // Enlarge the interactive area of the node.
          labelBackground: true,
          labelBackgroundFill: 'transparent',
          labelPadding,
          ...NodeStyle
        }
  }
})
/**
 * @description 图表初始化
 */
// eslint-disable-next-line max-lines-per-function
function init() {
  graph.value = new Graph({
    container: 'container',
    autoFit: 'view',
    height: 1200,
    data: treeToGraphData(graphData.value as any),
    node: {
      type: 'mindmap',
      style: (d) => {
        const direction = getDirection(graph.value!, d.id)
        const labelPadding = direction === 'right' ? [2, 40, 10, 0] : [2, 0, 10, 40]
        const isRoot = d.id === graphData.value.id
        return isRoot
          ? {
              color: getColor(graph.value!, d.id),
              direction,
              labelText: d.name,
              size: [getNodeWidth(d.name, isRoot), 30],
              labelBackground: true,
              labelBackgroundFill: 'transparent',
              labelPadding,
              ...RootNodeStyle
            }
          : {
              color: getColor(graph.value!, d.id),
              direction,
              labelText: d.name,
              size: [getNodeWidth(d.name, false), 30],
              // Enlarge the interactive area of the node.
              labelBackground: true,
              labelBackgroundFill: 'transparent',
              labelPadding,
              ...NodeStyle
            }
      }
    },
    edge: {
      type: 'mindmap',
      style: {
        lineWidth: 2,
        sourcePort: (d) => {
          if (d.source === graphData.value.id) return undefined
          const direction = getDirection(graph.value!, d.target)
          return direction === 'right' ? 'right-bottom' : 'left-bottom'
        },
        targetPort: (d) => {
          const direction = getDirection(graph.value!, d.target)
          return direction === 'right' ? 'left-bottom' : 'right-bottom'
        },
        stroke: (d) => {
          return getColor(graph.value!, d.target)
        }
      }
    },
    layout: {
      type: 'mindmap',
      direction: 'H',
      getHeight: () => 16,
      getWidth: (node) => getNodeWidth(node.name, graphData.value.id === node.id),
      getVGap: () => 10,
      getHGap: () => 60,
      getSide: (node) => getDirection(graph.value!, node.id)
    },
    animation: false,
    behaviors: ['drag-canvas', 'zoom-canvas', 'collapse-expand']
  })

  graph.value.once(GraphEvent.AFTER_RENDER, () => {
    graph.value?.fitView()
  })
  graph.value.render()
}

useResizeObserver(wrap, (entries) => {
  const entry = entries[0]
  const { width, height } = entry.contentRect
  graph.value?.resize(width, height)
})

onMounted(() => {
  register(ExtensionCategory.NODE, 'mindmap', MindmapNode)
  register(ExtensionCategory.EDGE, 'mindmap', MindmapEdge)
  register(ExtensionCategory.BEHAVIOR, 'collapse-expand-tree', CollapseExpandTree)
  init()
})

defineExpose(() => {
  graph
})
</script>
<style lang="css" scoped>
#container {
  height: 100%;
}
</style>
