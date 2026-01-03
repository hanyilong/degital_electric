import { Graph, Node } from '@antv/x6';
// import { NodeDataType } from '../graph-context';
import { updateSvgNodeStyle } from './svg-utils';
import {
    getPercentComponentRuntime,
    getBarChartComponentRuntime,
    getLineChartComponentRuntime,
    getPieChartComponentRuntime,
    getScatterChartComponentRuntime,
    getTableComponentRuntime,
    getSwitchComponentRuntime,
    getButtonComponentRuntime,
    getIFrameComponentRuntime,
    getVideoComponentRuntime
} from '../components/chart';



export const nodePorts = {
    groups: {
        top: {
            position: 'top',
            attrs: {
                circle: {
                    r: 4,
                    magnet: true,
                    stroke: '#5F95FF',
                    strokeWidth: 1,
                    fill: '#fff',
                    style: {
                        visibility: 'hidden',
                    },
                },
            },
        },
        right: {
            position: 'right',
            attrs: {
                circle: {
                    r: 4,
                    magnet: true,
                    stroke: '#5F95FF',
                    strokeWidth: 1,
                    fill: '#fff',
                    style: {
                        visibility: 'hidden',
                    },
                },
            },
        },
        bottom: {
            position: 'bottom',
            attrs: {
                circle: {
                    r: 4,
                    magnet: true,
                    stroke: '#5F95FF',
                    strokeWidth: 1,
                    fill: '#fff',
                    style: {
                        visibility: 'hidden',
                    },
                },
            },
        },
        left: {
            position: 'left',
            attrs: {
                circle: {
                    r: 4,
                    magnet: true,
                    stroke: '#5F95FF',
                    strokeWidth: 1,
                    fill: '#fff',
                    style: {
                        visibility: 'hidden',
                    },
                },
            },
        },
    },
    items: [
        { group: 'top' },
        { group: 'right' },
        { group: 'bottom' },
        { group: 'left' },
    ],
};

/**
 * 创建SVG节点
 * @param graph - 图实例
 * @param node - 原始节点
 * @param nodeData - 节点数据
 * @param initialWidth - 初始宽度
 * @param initialHeight - 初始高度
 * @returns 创建的SVG节点
 */
export function createSvgNode(graph: Graph, node: Node, nodeData: NodeDataType, initialWidth = 100, initialHeight = 100): Node {
    // 初始生成SVG的DataURL
    const initialSvgURL = updateSvgNodeStyle(node, nodeData, initialWidth, initialHeight);
    const { x, y } = node.position();
    // 添加节点
    const svgNode = graph.addNode({
        shape: 'svg-embed-node',
        x,
        y,
        width: initialWidth,
        height: initialHeight,
        attrs: {
            svgImage: {
                'xlink:href': initialSvgURL,
            },
            nodeData: nodeData
        },
        ports: { ...nodePorts },
    });
    return svgNode;
}

/**
 * 同步节点大小变化，更新节点样式
 * @param node - 节点对象
 */
export function syncImageWithNodeSize(node: Node): void {
    const { width, height } = node.size();
    // 仅处理图片节点
    if (node.shape === 'image') {
        // 关键：将图片宽高设置为与节点边框完全一致
        node.setAttrs({
            image: {
                width: width,   // 图片宽度 = 节点边框宽度
                height: height, // 图片高度 = 节点边框高度
                // 可选：根据需求设置比例模式
                preserveAspectRatio: 'none',  // 拉伸填充（不保持比例）
            }
        });
    } else if (node.shape === 'svg-embed-node') {
        node.setAttrs({
            svgImage: {
                width: width,   // 图片宽度 = 节点边框宽度
                height: height, // 图片高度 = 节点边框高度
            }
        });
        // 重新生成动态SVG的DataURL
        const newSvgURL = updateSvgNodeStyle(node, node.getData(), width, height);
        // 更新节点的svgImage属性
        node.attr('svgImage/xlink:href', newSvgURL);
    } else if (node.shape.startsWith('system-component-')) {
        let component = node.getData().componentObj;
        if (component && typeof (component as any).getExposeToNodeProps === 'function') {
            component.setComponentSize(width, height);
        } else {
            if (node.shape === 'system-component-percent') {
                component = getPercentComponentRuntime(node)
            } else if (node.shape === 'system-component-bar') {
                component = getBarChartComponentRuntime(node)
            } else if (node.shape === 'system-component-line') {
                component = getLineChartComponentRuntime(node)
            } else if (node.shape === 'system-component-pie') {
                component = getPieChartComponentRuntime(node)
            } else if (node.shape === 'system-component-scatter') {
                component = getScatterChartComponentRuntime(node)
            } else if (node.shape === 'system-component-table') {
                component = getTableComponentRuntime(node)
            } else if (node.shape === 'system-component-button') {
                component = getButtonComponentRuntime(node)
            } else if (node.shape === 'system-component-switch') {
                component = getSwitchComponentRuntime(node)
            } else if (node.shape === 'system-component-iframe') {
                component = getIFrameComponentRuntime(node)
            } else if (node.shape === 'system-component-video') {
                component = getVideoComponentRuntime(node)
            }
            component?.setComponentSize(width, height);
        }
    }
}

/**
 * 复制选中节点到剪贴板
 * @param graph - 图实例
 */
export function copySelectedNodeToClipboard(graph: Graph): void {
    const OFFSET = 20

    const selectedCells = graph.getSelectedCells()
    graph.unselect(selectedCells);
    if (selectedCells.length === 0) return

    // 分离节点和边（边依赖节点存在）
    const nodes = selectedCells.filter(cell => cell.isNode())
    const edges = selectedCells.filter(cell => cell.isEdge())

    // 深拷贝节点和边的数据（避免引用原对象）
    const copiedCells = {
        nodes: nodes.map(node => node.toJSON()),
        edges: edges.map(edge => edge.toJSON()),
    }
    // 开始创建复制内容
    const { nodes: copiedNodes, edges: copiedEdges } = copiedCells
    // 1. 复制节点并调整位置，记录原节点 ID 与新节点 ID 的映射
    const idMap = new Map<string, string>() // 原节点 ID -> 新节点 ID
    const newNodes = copiedNodes.map(node => {
        // 生成新 ID（避免与现有 ID 冲突）
        const newId = `${node.id}_copy_${Date.now().toString().slice(-4)}`
        idMap.set(node.id, newId)

        // 计算新位置（原位置 + 偏移量）
        const position = {
            x: node.position.x + OFFSET,
            y: node.position.y + OFFSET,
        }

        // 返回新节点数据（覆盖 ID 和位置）
        return {
            ...node,
            id: newId,
            position,
        }
    })

    // 2. 复制边，根据 ID 映射替换源和目标节点
    const newEdges = copiedEdges.map(edge => {
        const newId = `${edge.id}_copy_${Date.now().toString().slice(-4)}`
        // 替换源节点 ID
        const source = idMap.get(edge.source.cell as string) || edge.source
        if (typeof source === 'object' && 'x' in source && 'y' in source) {
            source.x += OFFSET
            source.y += OFFSET
        }
        // 替换目标节点 ID
        const target = idMap.get(edge.target.cell as string) || edge.target
        if (typeof target === 'object' && 'x' in target && 'y' in target) {
            target.x += OFFSET
            target.y += OFFSET
        }

        return {
            ...edge,
            id: newId,
            source,
            target,
        }
    })

    // 3. 将新节点和边添加到画布
    graph.addNodes(newNodes)
    graph.addEdges(newEdges)

    // 4. 选中新添加的元素
    graph.select(newNodes.map(node => node.id))
}
