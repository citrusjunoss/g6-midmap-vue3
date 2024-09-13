import { Rect, Text } from '@antv/g';
import {
  Badge,
  BaseBehavior,
  BaseNode,
  CommonEvent,
  CubicHorizontal,
  iconfont,
  NodeEvent,
  Graph
} from '@antv/g6';

const style = document.createElement('style');
style.innerHTML = `@import url('${iconfont.css}');`;
document.head.appendChild(style);

const COLORS = [
  '#1783FF',
  '#00C9C9',
  '#F08F56',
  '#D580FF',
  '#7863FF',
  '#DB9D0D',
  '#60C42D',
  '#FF80CA',
  '#2491B3',
  '#17C76F',
];

const RootNodeStyle = {
  fill: 'red',
  labelFill: '#262626',
  labelFontSize: 16,
  labelFontWeight: 600,
  labelPlacement: 'center',
  ports: [{ placement: 'right' }, { placement: 'left' }],
  radius: 4,
};

const NodeStyle = {
  fill: 'transparent',
  labelPlacement: 'center',
  labelFontSize: 12,
  ports: [
    { placement: 'right-bottom', key: 'right-bottom' },
    { placement: 'left-bottom', key: 'left-bottom' },
  ],
};

const TreeEvent = {
  COLLAPSE_EXPAND: 'collapse-expand',
};

const ancestorsOf = (graph: Graph, nodeId: string) => {
  const ancestors: any = [];
  const data = graph.getNodeData();

  const findAncestors = (data: any[], nodeId: string) => {
    for (const child of data) {
      if (
        child.id === nodeId ||
        (child.children &&
          findAncestors(
            child.children.map((child: any) => graph.getNodeData(child)),
            nodeId,
          ))
      ) {
        ancestors.push(String(child.id));
        return true;
      }
    }

    return false;
  };

  findAncestors(data, nodeId);
  return ancestors.reverse();
};

const rootChildOf = (graph: Graph, nodeId: string) => {
  return ancestorsOf(graph, nodeId)[1];
};

const findRootNode = (graph: Graph) => {
  const data = graph.getNodeData();
  for (const node of data) {
    const ancestors = ancestorsOf(graph, node.id);
    if (ancestors.length === 1) {
        return node;
    }
  }
  return undefined;
};

const getColor = (graph: Graph, nodeId: string) => {
  const rootNode = findRootNode(graph);
  if (!rootNode) return null;

  const oneLevelNodeIds = rootNode.children || [];
  const ancestorNode = rootChildOf(graph, nodeId) || nodeId;

  const order = oneLevelNodeIds.findIndex((id) => ancestorNode === id);
  return COLORS[order % COLORS.length];
};

const getDirection = (graph: Graph, nodeId: string) => {
  const rootNode = findRootNode(graph);
  if (!rootNode) return null;

  const rootId = rootNode.id;
  if (nodeId === rootId) return 'right';

  const ancestorNode = rootChildOf(graph, nodeId) || nodeId;
  return ancestorNode.charCodeAt(ancestorNode.length - 1) % 2 === 0 ? 'right' : 'left';
};

let textShape: Text;
const measureText = (text: any) => {
  if (!textShape) textShape = new Text({ style: text });
  textShape.attr(text);
  return textShape.getBBox().width;
};

const getNodeWidth = (text: string, isRoot: boolean) => {
  const width = isRoot
    ? measureText({ text, fontSize: RootNodeStyle.labelFontSize } as any) + 20
    : measureText({ text, fontSize: NodeStyle.labelFontSize } as any);
    return width;
};

class MindmapNode extends BaseNode {
  static defaultStyleProps: any = {
    showIcon: false,
  };

  constructor(options: any) {
    Object.assign(options.style, MindmapNode.defaultStyleProps);
    super(options);
  }

  get childrenData() {
    return this.context.model.getChildrenData(this.id);
  }

  get rootId() {
    return findRootNode(this.context.graph)!.id;
  }

  isShowCollapse(attributes: any) {
    return !attributes.collapsed && this.childrenData.length > 0;
  }

  getCollapseStyle(attributes: any) {
    const { showIcon, color, direction } = attributes;
    if (!this.isShowCollapse(attributes)) return false;
    const [width, height] = this.getSize(attributes);
    return {
      backgroundFill: color,
      backgroundHeight: 12,
      backgroundWidth: 12,
      cursor: 'pointer',
      fill: '#fff',
      fontFamily: 'iconfont',
      fontSize: 8,
      text: '\ue6e4',
      textAlign: 'center',
      transform: direction === 'left' ? 'rotate(90deg)' : 'rotate(-90deg)',
      visibility: showIcon ? 'visible' : 'hidden',
      x: direction === 'left' ? -6 : width + 6,
      y: height,
    };
  }

  drawCollapseShape(attributes: any, container: any) {
    const iconStyle = this.getCollapseStyle(attributes) as any;
    const btn = this.upsert('collapse-expand', Badge, iconStyle, container);
    this.forwardEvent(btn, CommonEvent.CLICK, (event: any) => {
      event.stopPropagation();
      this.context.graph.emit(TreeEvent.COLLAPSE_EXPAND, {
        id: this.id,
        collapsed: !attributes.collapsed,
      });
    });
  }

  getCountStyle(attributes: any) {
    const { collapsed, color, direction } = attributes;
    const count = this.context.model.getDescendantsData(this.id).length;
    if (!collapsed || count === 0) return false;
    const [width, height] = this.getSize(attributes);
    return {
      backgroundFill: color,
      backgroundHeight: 12,
      backgroundWidth: 12,
      cursor: 'pointer',
      fill: '#fff',
      fontSize: 8,
      text: count.toString(),
      textAlign: 'center',
      x: direction === 'left' ? -6 : width + 6,
      y: height,
    };
  }

  drawCountShape(attributes: any, container: any) {
    const countStyle = this.getCountStyle(attributes) as any;
    const btn = this.upsert('count', Badge, countStyle, container);

    this.forwardEvent(btn, CommonEvent.CLICK, (event: any) => {
      event.stopPropagation();
      this.context.graph.emit(TreeEvent.COLLAPSE_EXPAND, {
        id: this.id,
        collapsed: false,
      });
    });
  }


  forwardEvent(target: any, type: any, listener: any) {
    if (target && !Reflect.has(target, '__bind__')) {
      Reflect.set(target, '__bind__', true);
      target.addEventListener(type, listener);
    }
  }

  getKeyStyle(attributes: any) {
    const [width, height] = this.getSize(attributes);
    const keyShape = super.getKeyStyle(attributes);
    return { width, height, ...keyShape };
  }

  drawKeyShape(attributes: any, container: any) {
    const keyStyle = this.getKeyStyle(attributes);
    return this.upsert('key', Rect, keyStyle, container);
  }

  render(attributes = this.parsedAttributes, container: any) {
    super.render(attributes, container);
    this.drawCollapseShape(attributes, container);
    this.drawCountShape(attributes, container);
  }
}

class MindmapEdge extends CubicHorizontal {
  // @ts-ignore
  getKeyPath(attributes: any) {
    const path = super.getKeyPath(attributes);
    const isRoot = this.targetNode.id === findRootNode(this.context.graph)?.id;
    const labelWidth = getNodeWidth(this.targetNode.attributes.labelText, isRoot);
    const labelWidthNew = isRoot ? labelWidth + 20 : labelWidth
    const [, tp] = this.getEndpoints(attributes);
    const sign = this.sourceNode.getCenter()[0] < this.targetNode.getCenter()[0] ? 1 : -1;
    return [...path, ['L', tp[0] + labelWidthNew * sign, tp[1]]];
  } 
}

class CollapseExpandTree extends BaseBehavior {
  constructor(context: any, options: any) {
    super(context, options);
    this.bindEvents();
  }

  update(options: any) {
    this.unbindEvents();
    super.update(options);
    this.bindEvents();
  }

  bindEvents() {
    const { graph } = this.context;
    graph.on(NodeEvent.POINTER_ENTER, this.showIcon);
    graph.on(NodeEvent.POINTER_LEAVE, this.hideIcon);
    graph.on(TreeEvent.COLLAPSE_EXPAND, this.onCollapseExpand);
  }

  unbindEvents() {
    const { graph } = this.context;

    graph.off(NodeEvent.POINTER_ENTER, this.showIcon);
    graph.off(NodeEvent.POINTER_LEAVE, this.hideIcon);
    graph.off(TreeEvent.COLLAPSE_EXPAND, this.onCollapseExpand);
  }

  status = 'idle';

  showIcon = (event: any) => {
    this.setIcon(event, true);
  };

  hideIcon = (event: any) => {
    this.setIcon(event, false);
  };

  setIcon = (event: any, show: boolean) => {
    if (this.status !== 'idle') return;
    const { target } = event;
    const id = target.id;
    const { graph, element } = this.context;
    graph.updateNodeData([{ id, style: { showIcon: show } }]);
    element!.draw({ animation: false, silence: true });
  };

  onCollapseExpand = async (event: any) => {
    this.status = 'busy';
    const { id, collapsed } = event;
    const { graph } = this.context;
    await graph.frontElement(id);
    if (collapsed) await graph.collapseElement(id);
    else await graph.expandElement(id);
    this.status = 'idle';
  };
}



export {
    getNodeWidth,
    getDirection,
    getColor,
    CollapseExpandTree,
    MindmapEdge,
    MindmapNode,
    NodeStyle,
    RootNodeStyle
}