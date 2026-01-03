// MainCanvas.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Graph, Node, Edge, Transform, Snapline, Keyboard, Clipboard, Selection } from '@antv/x6';
import { useCounter } from '../graph-context';
import { syncImageWithNodeSize, nodePorts, createSvgNode } from '../utils/node-utils';
import { handleClipboardData } from '../utils/clipboard-utils';



interface MainCanvasProps {
    graph: Graph | null;
}

const MainCanvas: React.FC<MainCanvasProps> = ({ graph }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const { displayRef, boardConfigure, storeBoardConfigureData } = useCounter(); // 从 Context 获取方法
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const saveDataTask = () => {
        if (!graph) {
            return;
        }
        if (boardConfigure) {
            const defaultOptions = graph?.options
            if (defaultOptions) {
                boardConfigure.router = defaultOptions.connecting?.router as string;
            }
            boardConfigure.bgColor = graph.container.style.backgroundColor
            boardConfigure.bgImage = graph.container.style.backgroundImage
            boardConfigure.boardData = graph.toJSON();
            const cells = graph.getCells();
            const nodeDataConfigs = [];
            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                const cellData = cell.getData();
                if (cellData) {
                    nodeDataConfigs.push(cellData);
                }
            }
            boardConfigure.nodeDataConfigs = nodeDataConfigs;
            storeBoardConfigureData(boardConfigure);
        }
    };

    const handleDelay = () => {
        // 找到当前画布中静态文本标签的节点，并设置为默认样式
        const staticTextNodes = graph?.getNodes().filter(node => node.shape === 'static-text-graph');
        staticTextNodes?.forEach(node => {
            const nd = node.getData();
            const nodeContainer = document.getElementById(node.id + 'container');
            if (nodeContainer && nd?.textStyle) {
                nodeContainer.innerHTML = nd?.textStyle.html;
                const textStates = nd?.defaultStyle;
                const style = "font-family: " + textStates.font + "; font-size: " + textStates.size + "pt;font-weight: " + (textStates.isBold ? "bold" : "normal") + ";font-style: " + (textStates.isItalic ? "italic" : "normal") + ";text-decoration: " + (textStates.isUnderline ? "underline" : "none") + ";color: " + textStates.color;
                const containerId = node?.id + 'container';
                const container = document.getElementById(containerId)!;
                if (container) {
                    container.style.cssText = style;
                }
            }
        });
        const options = {
            image: boardConfigure?.bgImage,
            size: "contain",
            repeat: "no-repeat",
            opacity: 0.5,
            quality: 1
        };
        graph?.drawBackground(options);
    };

    useEffect(() => {
        if (canvasRef.current && graph) {
            // 初始化Graph并挂载到当前容器
            canvasRef.current.addEventListener('paste', (e) => handleClipboardData(e, graph));

            // #region 2. 使用插件（逻辑不变）
            graph
                .use(new Transform({ resizing: true, rotating: true }))
                .use(new Snapline())
                .use(new Keyboard())
                .use(new Clipboard());
            graph.use(
                new Selection({
                    enabled: true,
                    strict: true,
                    multiple: true,
                    rubberband: true, // 框选工具
                    rubberEdge: true,
                    showNodeSelectionBox: true, // 显示选中节点的边框
                    showEdgeSelectionBox: true, // 显示选中边的边框
                })
            );

            // #endregion

            // 绑定键盘事件
            graph.bindKey(['meta+x', 'ctrl+x'], () => {
                const cells = graph.getSelectedCells();
                if (cells.length) graph.cut(cells);
                return false;
            });
            graph.bindKey(['meta+v', 'ctrl+v'], (e) => {
                console.log('paste');
                if (!graph.isClipboardEmpty()) {
                    const cells = graph.paste({ offset: 32 });
                    graph.cleanSelection();
                    graph.select(cells);
                }
                return true;
            });
            graph.bindKey(['meta+a', 'ctrl+a'], () => {
                const nodes = graph.getNodes();
                if (nodes) graph.select(nodes);
            });
            graph.bindKey(['backspace', 'delete'], () => {
                const cells = graph.getSelectedCells();
                if (cells.length) graph.removeCells(cells);
            });
            graph.bindKey(['ctrl+1', 'meta+1'], () => {
                const zoom = graph.zoom();
                if (zoom < 1.5) graph.zoom(0.1);
            });
            graph.bindKey(['ctrl+2', 'meta+2'], () => {
                const zoom = graph.zoom();
                if (zoom > 0.5) graph.zoom(-0.1);
            });

            graph.bindKey('arrowleft', () => {
                const nodes = graph.getSelectedCells();
                if (nodes.length === 1) {
                    nodes[0].prop('position', {
                        x: nodes[0].getBBox().x - 1,
                        y: nodes[0].getBBox().y
                    });
                }
            });

            graph.bindKey('arrowright', () => {
                const nodes = graph.getSelectedCells();
                if (nodes.length === 1) {
                    nodes[0].prop('position', {
                        x: nodes[0].getBBox().x + 1,
                        y: nodes[0].getBBox().y
                    });
                }
            });

            graph.bindKey('arrowup', () => {
                const nodes = graph.getSelectedCells();
                if (nodes.length === 1) {
                    nodes[0].prop('position', {
                        x: nodes[0].getBBox().x,
                        y: nodes[0].getBBox().y - 1
                    });
                }
            });

            graph.bindKey('arrowdown', () => {
                const nodes = graph.getSelectedCells();
                if (nodes.length === 1) {
                    nodes[0].prop('position', {
                        x: nodes[0].getBBox().x,
                        y: nodes[0].getBBox().y + 1
                    });
                }
            });

            // 控制连接桩显示/隐藏
            const showPorts = (ports: NodeListOf<SVGElement>, show: boolean) => {
                for (let i = 0, len = ports.length; i < len; i += 1) {
                    ports[i].style.visibility = show ? 'visible' : 'hidden';
                }
            };
            graph.on('node:mouseenter', () => {
                const container = canvasRef.current;
                const ports = container?.querySelectorAll('.x6-port-body') as NodeListOf<SVGElement>;
                showPorts(ports, true);
            });

            // 监听节点选择事件
            graph.on('node:selected', ({ node }) => {
                if (displayRef && typeof displayRef.cellSelected === 'function') {
                    // displayRef.cellSelected(node);
                }
            });
            //监听边点击事件
            graph.on('edge:click', ({ edge }) => {
                if (displayRef && typeof displayRef.cellSelected === 'function') {
                    displayRef.cellSelected(edge);
                }
            });

            //监听节点点击事件
            graph.on('node:click', ({ node }) => {
                if (displayRef && typeof displayRef.cellSelected === 'function') {
                    displayRef.cellSelected(node);
                }
            });

            graph.on('node:unselected', (args) => {
                if (displayRef && typeof displayRef.cellSelected === 'function') {
                    displayRef.cellSelected(null);
                }
            });

            graph.on('node:dblclick', ({ node }) => {
                if (node.shape === 'custom-rect' || node.shape === 'custom-circle') {
                    console.log('custom-rect or custom-circle');
                    const inputText = window.prompt(
                    );
                    if (inputText !== null) {
                        const trimmedText = inputText.trim();
                        if (trimmedText) {
                            node.attr('text/text', trimmedText);
                        }
                    }
                } else if (node.shape === 'customImage') {
                    console.log('customImage');
                }
            });
            graph.on('node:mouseleave', () => {
                const container = canvasRef.current;
                const ports = container?.querySelectorAll('.x6-port-body') as NodeListOf<SVGElement>;
                showPorts(ports, false);
            });
            graph.on('node:resized', ({ node }) => {
                syncImageWithNodeSize(node);
            });

            graph.on('node:added', (args) => {
                // 存储临时线条
                let tempEdge: Edge | null = null;
                let startPoint: { x: number; y: number } | null = null;
                let endPoint: { x: number; y: number } | null = null;
                let node = args.node;
                if (node.shape === 'customImage') {
                    const preNodeData = node.attr("nodeData");
                    graph.addNode({
                        shape: 'image',
                        x: node.position().x,
                        y: node.position().y,
                        width: 100,
                        height: 100,
                        imageUrl: preNodeData.defaultStyle.imageUrl,
                        attrs: {
                            body: {
                                fill: 'none',
                                stroke: '#080808ff',
                            },
                            nodeData: preNodeData
                        },
                        ports: { ...nodePorts },
                    });
                    graph.removeNode(node);
                } else if (node.shape === 'svgImage') {
                    const preNodeData = node.attr("nodeData");
                    createSvgNode(graph, node, preNodeData, 100, 100);
                    graph.removeNode(node);
                } else if (node.shape === 'systemComponent') {
                    const preNodeData = node.attr("nodeData");
                    const defaultStyle = preNodeData.defaultStyle;
                    const width = defaultStyle.width ? defaultStyle.width : 100;
                    const height = defaultStyle.height ? defaultStyle.height : 100;
                    graph.addNode({
                        shape: preNodeData.defaultStyle.systemComponent,
                        x: node.position().x,
                        y: node.position().y,
                        width: width,
                        height: height,
                        attrs: {
                        },
                        ports: { ...nodePorts },
                    });
                    graph.removeNode(node);
                } else if (node.shape === 'custom-line-icon') {
                    // 获取起始点坐标
                    startPoint = { x: node.position().x, y: node.position().y };
                    endPoint = { x: node.position().x + 100, y: node.position().y };
                    let defaultNodeData = node.attr("nodeData");
                    const defaultStyle = defaultNodeData?.defaultStyle;
                    const defaultStroke = defaultStyle?.stroke;
                    const strokeWidth = defaultStyle?.strokeWidth;
                    const defaultColer = defaultStroke ? defaultStroke : '#080808ff';

                    // 创建临时线条
                    tempEdge = graph.createEdge({
                        source: startPoint, // 源端点坐标
                        target: endPoint, // 目标端点坐标
                        router: { name: 'normal' },
                        connector: { name: 'normal' },
                        attrs: {
                            line: {
                                strokeWidth: strokeWidth ? strokeWidth : 2,
                                stroke: defaultColer,
                                fill: 'none',
                                strokeLinecap: 'round',
                                sourceMarker: {
                                    name: 'circle',
                                    r: 1,
                                    fill: defaultColer,
                                    stroke: defaultColer,
                                    strokeWidth: 0,
                                    // 调整Marker位置，与工具交互区域对齐
                                    dx: 0,
                                    dy: 0
                                },
                                targetMarker: {
                                    name: 'circle',
                                    r: 1,
                                    fill: defaultColer,
                                    stroke: defaultColer,
                                    strokeWidth: 0,
                                    dx: 0,
                                    dy: 0
                                }
                            },
                        },
                        tools: [
                            {
                                name: 'source-arrowhead',
                                // 自定义工具的位置和大小，与圆形Marker对齐
                                args: {
                                    attrs: {
                                        d: 'M 0 0 A 3 3 0 1 1 6 0 A 3 3 0 1 1 0 0 Z',
                                        fill: defaultColer,
                                        stroke: 'none',
                                        'stroke-width': 0,
                                    },
                                },
                            },
                            {
                                name: 'target-arrowhead',
                                args: {
                                    attrs: {
                                        d: 'M 0 0 A 3 3 0 1 1 6 0 A 3 3 0 1 1 0 0 Z',
                                        fill: defaultColer,
                                        stroke: 'none',
                                        'stroke-width': 0,
                                    },
                                },
                            }
                        ],
                    });
                    if (!defaultNodeData) {
                        defaultNodeData = {
                            nodeId: tempEdge.id,
                            nodeType: tempEdge.shape,
                            dataSource: "IOT"
                        };
                    } else {
                        defaultNodeData.nodeId = tempEdge.id;
                        defaultNodeData.nodeType = tempEdge.shape;
                        defaultNodeData.dataSource = "IOT";
                    }
                    tempEdge.setData(defaultNodeData);
                    graph.addEdge(tempEdge);
                    graph.removeNode(node);
                } else if (node.shape === 'static-text-icon') {
                    const defaultNodeData = node.attr("nodeData");
                    const realShapeName = node.getData()?.realShapeName;
                    graph.addNode({
                        shape: realShapeName,
                        x: node.position().x,
                        y: node.position().y,
                        width: 120,
                        height: 28,
                        attrs: { ...node.attrs, nodeData: defaultNodeData },
                        ports: { ...nodePorts },
                    });
                    graph.removeNode(node);
                } else if (node.shape === 'custom-rect-icon') {
                    const defaultNodeData = node.attr("nodeData");
                    const realShapeName = node.getData()?.realShapeName;
                    graph.addNode({
                        shape: realShapeName,
                        x: node.position().x,
                        y: node.position().y,
                        width: 100,
                        height: 100,
                        attrs: { ...node.attrs, nodeData: defaultNodeData },
                        ports: { ...nodePorts },
                    });
                    graph.removeNode(node);
                } else if (node.shape === 'custom-circle-icon') {
                    const defaultNodeData = node.attr("nodeData");
                    const realShapeName = node.getData()?.realShapeName;
                    graph.addNode({
                        shape: realShapeName,
                        x: node.position().x,
                        y: node.position().y,
                        width: 100,
                        height: 100,
                        attrs: { ...node.attrs, nodeData: defaultNodeData },
                        ports: { ...nodePorts },
                    });
                    graph.removeNode(node);
                } else if (node.shape === 'static-text-graph' ||
                    node.shape === 'rect' || node.shape === 'circle' ||
                    node.shape === 'image' || node.shape === 'svg-embed-node' ||
                    node.shape.startsWith('system-component-')) {
                    const defaultNodeData = node.attr("nodeData");
                    if (defaultNodeData) {
                        defaultNodeData.nodeId = node.id;
                        defaultNodeData.nodeType = node.shape;
                        defaultNodeData.dataSource = "IOT";
                        if (node.getData()) {
                            const preData = node.getData();
                            preData.nodeId = node.id;
                            preData.nodeType = node.shape;
                            preData.dataSource = "IOT";
                        } else {
                            node.setData(defaultNodeData);
                        }
                    } else {
                        if (node.getData()) {
                            const preData = node.getData();
                            preData.nodeId = node.id;
                            preData.nodeType = node.shape;
                            preData.dataSource = "IOT";
                        } else {
                            node.setData({
                                nodeId: node.id,
                                nodeType: node.shape,
                                dataSource: "IOT"
                            });
                        }
                    }
                    // 如果节点是静态文本，则设置文本内容为TextStyleConfig 的html
                    if (node.shape === 'static-text-graph') {
                        const textData = node.getData();
                        if (textData && textData.textStyle) {
                            // 设置文本内容为TextStyleConfig 的html
                            const nodeContainer = document.getElementById(node.id + 'container');
                            if (nodeContainer) {
                                nodeContainer.innerHTML = textData.textStyle?.html;
                            } else {
                                console.log('静态文本节点容器不存在, 需要重新创建');
                            }
                        }
                    }
                }
            });

            // 如果本地缓存有画布数据，加载到画布
            if (boardConfigure) {
                if (boardConfigure.router) {
                    let defaultOptions = graph?.options
                    if (defaultOptions) {
                        defaultOptions.connecting.router = boardConfigure.router
                    }
                }
                if (boardConfigure.boardData) {
                    graph?.fromJSON(boardConfigure.boardData);
                    setTimeout(handleDelay, 2000);
                }
                if (boardConfigure.width && boardConfigure.height) {
                    graph?.resize(boardConfigure.width < 1000 ? 1000 : boardConfigure.width, boardConfigure.height < 1000 ? 1000 : boardConfigure.height);
                } else {
                    graph?.resize(1500, 1000);
                }
                const graphContainer: HTMLDivElement | null = document.getElementById('graphCanvasContainer');
                if (graphContainer) {
                    if (boardConfigure.bgColor && boardConfigure.bgColor !== 'none') {
                        graphContainer.style.backgroundColor = boardConfigure.bgColor;
                    } else {
                        graphContainer.style.backgroundColor = '#ffffff';
                    }
                }
            } else {
                graph?.resize(1500, 1000);
            }
        }
    }, [graph, boardConfigure, displayRef, storeBoardConfigureData]);

    useEffect(() => {
        if (graph) {
            intervalRef.current = setInterval(saveDataTask, 20000);
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [graph, boardConfigure, storeBoardConfigureData]);

    return (
        <>
            <div id="graphCanvasContainer"
                ref={canvasRef} className='app-content'
            />
        </>
    );
};

export default MainCanvas;
