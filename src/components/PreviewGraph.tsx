
import React, { useRef, useEffect, useState } from 'react';
import { Graph, Node, Shape, Cell } from '@antv/x6';
import { Button, Modal, Form, Input, Drawer, type DrawerProps } from 'antd';
import { type ApiConfigure, type NodeDataType, type IotConfigure, type StyleConfigure, type TextStyleConfig, type BoardConfigure, type RandomConfig, type FixedConfig } from '../graph-context'
import { useCounter } from '../graph-context.tsx';
import { requestApi, api, extractJsonValue } from '../utils.ts'

const PreviewGraph: React.FC = () => {
  const { boardConfigure } = useCounter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [graph, setGraph] = useState<Graph>();
  const [curBoardConfig, setCurBoardConfig] = useState<BoardConfigure>();
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<DrawerProps['size']>();
  const [url, setUrl] = useState('https://www.baidu.com');

  const showDeviceDrawer = (nodeData: NodeDataType) => {
    if (!nodeData) {
      return;
    }
    if (nodeData.dataSource === 'IOT' && nodeData.iotConfigure && nodeData.iotConfigure.deviceId) {
      setUrl("https://www.baidu.com");
      setSize('large');
      setOpen(true);
    }
  };
  const showCameraDrawer = (nodeData: NodeDataType) => {
    if (!nodeData) {
      return;
    }
    if (nodeData.dataSource === 'IOT' && nodeData.iotConfigure && nodeData.iotConfigure.deviceId) {
      setUrl("https://www.baidu.com");
      setSize('large');
      setOpen(true);
    }
  };
  const showLinkDrawer = (nodeData: NodeDataType) => {
    if (!nodeData) {
      return;
    }
    if (nodeData.dataSource === 'IOT' && nodeData.iotConfigure && nodeData.iotConfigure.deviceId) {
      setUrl("https://www.baidu.com");
      setSize('large');
      setOpen(true);
    }
  };
  const onClose = () => {
    setOpen(false);
  };
  const handleDeviceOk = () => {
    setIsDeviceModalOpen(false);
  };
  const handleDeviceCancel = () => {
    setIsDeviceModalOpen(false);
  };

  const handleDelay = (graphPreview: Graph) => {
    // 找到当前画布中静态文本标签的节点，并设置为默认样式
    const staticTextNodes = graphPreview?.getNodes().filter(node => node.shape === 'static-text-graph');
    staticTextNodes?.forEach(node => {
      const nd = node.getData();
      const nodeContainer = document.getElementById(node.id + 'container');
      if (nd?.textStyle && nd?.textStyle.html) {
        nodeContainer.innerHTML = nd?.textStyle.html;
      }
      const textStates = nd?.defaultStyle;
      const style = "font-family: " + textStates.font + "; font-size: " + textStates.size + "pt;font-weight: " + (textStates.isBold ? "bold" : "normal") + ";font-style: " + (textStates.isItalic ? "italic" : "normal") + ";text-decoration: " + (textStates.isUnderline ? "underline" : "none") + ";color: " + textStates.color;
      const containerId = node?.id + 'container';
      const container = document.getElementById(containerId)!;
      if (container) {
        container.style.cssText = style;
      }
    });
    const imageNodes = graphPreview?.getNodes().filter(node => node.shape === 'image');
      // 可以在这里添加图片节点的处理逻辑

    updateEdgeNodeStrokeStyle(graphPreview);
  }

  const updateEdgeNodeStrokeStyle = (graphPreview: Graph) => {
    //更新edge的端点fill颜色，和edge的颜色保持一致
    const toolSourcePaths = document.querySelectorAll('.x6-edge-tool-source-arrowhead');
    toolSourcePaths.forEach(node => {
      const parent = node.parentNode
      const parentId = parent?.getAttribute('data-cell-id')
      const edge = graphPreview?.getCellById(parentId)
      const stroke = edge?.attrs?.line.stroke;

      if (node.nodeName === 'path' && parentId === edge.id) {
        node.setAttribute('fill', stroke);
        node.setAttribute('stroke', 'none');
      }
    });
    const toolTargetPaths = document.querySelectorAll('.x6-edge-tool-target-arrowhead');
    toolTargetPaths.forEach(node => {
      const parent = node.parentNode
      const parentId = parent?.getAttribute('data-cell-id')
      const edge = graphPreview?.getCellById(parentId)
      const stroke = edge?.attrs?.line.stroke;
      if (node.nodeName === 'path' && parentId === edge.id) {
        node.setAttribute('fill', stroke);
        node.setAttribute('stroke', 'none');
      }
    });
  }

  const renderGraphFromBoardConfig = (graphPreview: Graph, bc: BoardConfigure) => {
    const c: HTMLDivElement = document.getElementById('graphPreviewContainer')
    c.style.backgroundColor = bc?.bgColor;

    const defaultOptions = graphPreview?.options
    if (defaultOptions) {
      defaultOptions.connecting.router = bc.router
    }
    graphPreview?.fromJSON(bc?.boardData);
    // graphPreview?.centerContent();
    graphPreview?.resize(bc?.width, bc?.height);

    graphPreview?.on('node:click', ({ node }) => {
      console.log('node', node);
      const eventType = node.getData()?.eventConfig?.eventType;

      if (eventType === 'OpenDeviceDetail') {
        showDeviceDrawer(node.getData());
      } else if (eventType === 'OpenCamera') {
        showCameraDrawer(node.getData());
      } else if (eventType === 'OpenLinkDrawer') {
        showLinkDrawer(node.getData());
      } else if (eventType === 'OpenLinkBlank') {
        const url = node.getData()?.eventConfig?.eventValue;
        window.open(url, '_blank');
      }
    });
    setTimeout(handleDelay, 1000, graphPreview);
  }

  const loadBoardData = (graphPreview: Graph) => {
    const queryString = window.location.search;

    // 解析查询参数
    const params = new URLSearchParams(queryString);

    // 获取特定参数
    const graphId = params.get('graphId');

    if (graphId) {
      const boardResponse = async (): Promise<object> => {
        try {
          const data = await api.get("http://127.0.0.1:8003/api/graph", {
            timeout: 3000
          });
          if (data.data.length > 0) {
            return data.data[0];
          }
        } catch (error) {
          console.log('error', error)
        }
      }
      boardResponse().then(data => {
        const boardData = JSON.parse(data?.data);
        const dbboardConfigure = {
          boardId: data?.graphId, boardName: data?.name, bgColor: data?.bgColor, width: data?.width, height: data?.height,
          nodeDataConfigs: JSON.parse(data?.nodeConfigs)
        }
        setCurBoardConfig(dbboardConfigure);
        renderGraphFromBoardConfig(graphPreview, dbboardConfigure);
      })
    } else if (boardConfigure?.boardData) {
      setCurBoardConfig(boardConfigure);
      renderGraphFromBoardConfig(graphPreview, boardConfigure);
    }
    if (graphPreview) {
      setGraph(graphPreview);
      updateEdgeNodeStrokeStyle(graphPreview);
    }


  }

  // 设置定时器定期更新节点数据
  // 当graph实例可用时启动定时器，每隔5秒更新一次节点数据
  useEffect(() => {
    // 只有当graph实例存在时才启动定时器
    if (graph) {
      // 每隔5秒执行一次logTask函数，更新节点数据
      intervalRef.current = setInterval(logTask, 5000);
    }
    
    // 清理函数：在组件卸载或graph变化时清除定时器
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null; // 确保定时器引用被重置
      }
    };
  }, [graph])

  // 更新画布背景
  // 当curBoardConfig或graph变化时，根据配置更新画布背景图片
  useEffect(() => {
    // 只有当curBoardConfig和graph都存在时才更新背景
    if (curBoardConfig && graph) {
      // 获取背景图片配置
      const { bgImage } = curBoardConfig;
      
      // 如果有背景图片，则设置背景
      if (bgImage) {
        graph.drawBackground({
          image: bgImage,       // 背景图片URL
          size: "contain",      // 图片适应方式
          repeat: "no-repeat",  // 不重复平铺
          opacity: 0.5,         // 透明度
          quality: 1            // 图片质量
        });
      } else {
        // 如果没有背景图片，则清除背景
        graph.drawBackground(null);
      }
    }
  }, [curBoardConfig, graph])

  /**
 * 解析字符串模板，替换表达式为真实数据
 * @param template 数据库存储的模板字符串
 * @param data 接口返回的原始数据
 * @returns 渲染后的ECharts配置JSON
 */
const renderChartTemplate = (template: string, data: any[]) => {
  // 正则匹配 `${表达式}` 格式的占位符
  const exprReg = /\$\{([^}]+)\}/g;
  
  // 替换所有占位符
  const replacedStr = template.replace(exprReg, (_, expr) => {
    try {
      // 用new Function执行表达式，绑定data为入参（安全可控）
      const fn = new Function('data', `return ${expr};`);
      const result = fn(data);
      // 将数组/数值转为JSON字符串（避免语法错误）
      return JSON.stringify(result);
    } catch (err) {
      console.error(`表达式执行失败: ${expr}`, err);
      return '[]'; // 兜底返回空数组
    }
  });

  // 解析为JSON对象（ECharts配置）
  try {
    return JSON.parse(replacedStr);
  } catch (err) {
    console.error('模板渲染后JSON解析失败', err);
    return null;
  }
};

  const renderDataWithHtmlTemplate = (nodeContainer: HTMLDivElement, data: object, htmlTemplate: string) => {
    const html = htmlTemplate.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = data[key];
      if (typeof value === 'string') {
        return value;
      } else {
        return JSON.stringify(value);
      }
    });
    nodeContainer.innerHTML = html;
  }

  const setTextNodeLabelByIotData = (cell: Cell, iotConfigure: IotConfigure) => {

  }



  const setTextNodeLabelBtApiData = (cell: Cell, apiConfigure: ApiConfigure, textStyleConfig: TextStyleConfig) => {
    const nodeId = cell.id;
    const nodeContainer = document.getElementById(nodeId + 'container');
    if (nodeContainer) {
      const apiResponse = async (): Promise<object> => {
        try {
          if (!apiConfigure.apiMethod || apiConfigure.apiMethod === 'GET') {
            const data = await api.get(apiConfigure.apiUrl, {
              timeout: 3000
            });
            return data
          } else if (apiConfigure.apiMethod === 'POST') {
            const data = await api.post(apiConfigure.apiUrl, {
              body: apiConfigure.apiBody,
              timeout: 3000
            });
            return data
          }
        } catch (error) {
          console.error('API request error:', error);
        }
      }
      apiResponse().then(data => {
        if (textStyleConfig && textStyleConfig.html.length > 10) {
          renderDataWithHtmlTemplate(nodeContainer, data, textStyleConfig.html);
        } else if (apiConfigure.extractPath && apiConfigure.extractPath.length > 0) {
          const value = extractJsonValue(data, apiConfigure.extractPath);
          nodeContainer.textContent = value;
        } else {
          nodeContainer.textContent = JSON.stringify(data, null, 2);;
        }
      })
    }
  }
  const generateRandomNumber = (
    min: number = 1,    // 最小值，默认1
    max: number = 10,   // 最大值，默认10
    decimalPlaces: number = 2  // 保留小数位数，默认2
  ): number => {
    // 1. 严格校验输入参数的有效性
    const validMin = typeof min === 'number' && !isNaN(min) ? min : 1;
    const validMax = typeof max === 'number' && !isNaN(max) ? max : 10;
    const validDecimal = Math.max(0, Math.min(20, Math.floor(decimalPlaces))) || 2; // 限制小数位数0-20

    // 2. 确保min < max，避免计算异常
    const [actualMin, actualMax] = validMin < validMax ? [validMin, validMax] : [validMax, validMin];

    // 3. 生成随机数并确保是有效数字
    let randomNum = Math.random() * (actualMax - actualMin) + actualMin;
    if (isNaN(randomNum)) {
      randomNum = (actualMin + actualMax) / 2; // 异常时返回中间值
    }

    // 4. 安全调用toFixed并转换为数字
    return Number(randomNum.toFixed(validDecimal));
  };


  const setTextNodeLabelBtRandomData = (cell: Cell, randomConfigure: RandomConfig, textStyleConfig: TextStyleConfig) => {
    const nodeId = cell.id;
    const nodeContainer = document.getElementById(nodeId + 'container');
    if (nodeContainer) {
      const randomData = generateRandomNumber(randomConfigure.minValue, randomConfigure.maxValue, 2);
      if (textStyleConfig && textStyleConfig.html.length > 10) {
        renderDataWithHtmlTemplate(nodeContainer, { "data": randomData }, textStyleConfig.html);
      } else {
        nodeContainer.innerHTML = randomData.toString();
      }
    }
  }

  const setTextNodeLabelBtFixedData = (cell: Cell, fixedConfigure: FixedConfig, textStyleConfig: TextStyleConfig) => {
    const nodeId = cell.id;
    const nodeContainer = document.getElementById(nodeId + 'container');
    if (nodeContainer) {
      if (textStyleConfig && textStyleConfig.html.length > 10) {
        renderDataWithHtmlTemplate(nodeContainer, { "data": fixedConfigure.dataValue }, textStyleConfig.html);
      } else {
        nodeContainer.innerHTML = fixedConfigure.dataValue;
      }
    }
  }

  const setNodeStateStyleByIotData = (cell: Cell, nodeConfig: NodeDataType) => {

  }

  const setNodeStyle = (cell: Cell, style: StyleConfigure) => {
    if (style && cell) {
      cell?.attr({
        label: {
          fill: style.color,
          fontSize: style.size,
          fontWeight: (style.isBold ? "bold" : "normal"),
          fontStyle: (style.isItalic ? "italic" : "normal"),
        },
        body: {
          fill: style.fillColor,
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
          strokeDasharray: style.strokeDasharray,
        }
      })
      if (cell.shape === 'edge' && style.animation && cell.attrs && cell.attrs.line) {
        cell.attrs.line.strokeDasharray = 15;
        cell.attrs.line.strokeDashoffset = 0;
        cell.attrs.line.stroke = style.stroke;
        // 配置并启动动画
        cell.animate(
          {
            'attrs/line/strokeDashoffset': -20, // 动画属性：从 -20 到 0 循环
          },
          {
            duration: 2000, // 动画时长
            iterations: Infinity, // 无限循环
            easing: 'linear', // 线性动画（匀速）
          }
        );
        updateEdgeNodeStrokeStyle(graph);
      }
    }
  }

  //更改图片样式，根据状态更换图片地址
  const setNodeImageStyle = (cell: Cell, style: StyleConfigure) => {
    if (style) {
      cell?.attr({
        image: {
          'xlink:href': style.imageUrl,
        }
      })
    }
  }

  // 根据逻辑表达式判断结果是true还是false，然后设置节点样式，比如表达式为 dataValue > 50 则判断dataValue是否大于50
  /**
  * 根据数值和表达式/数值进行比较判断
  * @param dataValue 待比较的数值
  * @param expression 比较表达式（如 ">1"）或纯数值（如 "2"）
  * @returns 比较结果（布尔值）
  */
  const evaluateExpression = (
    dataValue: number | string,
    expression: number | string
  ): boolean => {
    // 统一转为字符串预处理，移除空格
    const cleanDataValue = String(dataValue).trim();
    const cleanExpr = String(expression).trim();

    // 定义支持的运算符（长运算符放前面，避免被短的匹配）
    const operators = ['>=', '<=', '==', '!=', '>', '<', '='];

    // 1. 查找表达式中的运算符
    let operator = '';
    let compareValueStr = '';
    for (const op of operators) {
      if (cleanExpr.startsWith(op)) {
        operator = op;
        compareValueStr = cleanExpr.slice(op.length).trim();
        break;
      }
    }

    // 2. 如果没有找到运算符，说明是纯值比较（严格相等）
    if (!operator) {
      // 先尝试数字相等（兼容 8 === "8"），再判断字符串严格相等
      const dataNum = Number(cleanDataValue);
      const exprNum = Number(cleanExpr);

      // 若两者都能转成有效数字，按数字比较；否则按字符串严格比较
      if (!isNaN(dataNum) && !isNaN(exprNum)) {
        return dataNum === exprNum;
      } else {
        return cleanDataValue === cleanExpr;
      }
    }

    // 3. 解析比较值（运算符场景，统一转数字比较）
    const compareValue = Number(compareValueStr);
    const dataValueNum = Number(cleanDataValue);
    // 若任意一方无法转数字，直接返回false
    if (isNaN(compareValue) || isNaN(dataValueNum)) {
      return false;
    }

    // 4. 根据运算符执行比较逻辑
    switch (operator) {
      case '>':
        return dataValueNum > compareValue;
      case '<':
        return dataValueNum < compareValue;
      case '>=':
        return dataValueNum >= compareValue;
      case '<=':
        return dataValueNum <= compareValue;
      case '==':
      case '=':
        return dataValueNum === compareValue;
      case '!=':
        return dataValueNum !== compareValue;
      default:
        return false;
    }
  };

  const setNodeStateStyleByApiData = (cell: Cell, nodeConfig: NodeDataType) => {
    const apiConfigure = nodeConfig.apiConfigure;
    if (!apiConfigure) {
      return;
    }
    const stopStyle = nodeConfig.stopStyle;
    const startStyle = nodeConfig.startStyle;
    const apiResponse = async (): Promise<object> => {
      try {
        if (!apiConfigure.apiMethod) {
          apiConfigure.apiMethod = 'GET'
        }
        console.log('node url', apiConfigure.apiUrl)
        if (!apiConfigure.apiMethod || apiConfigure.apiMethod === 'GET') {
          const data = await api.get(apiConfigure.apiUrl, {
            timeout: 3000
          });
          return data
        } else if (apiConfigure.apiMethod === 'POST') {
          const data = await api.post(apiConfigure.apiUrl, {
            body: apiConfigure.apiBody,
            timeout: 3000
          });
          return data
        }
      } catch (error) {
        console.log('error', error)
      }
    }
    apiResponse().then(data => {
      console.log('api responsedata', data);
      const value = extractJsonValue(data, apiConfigure.extractPath);
      if (cell.shape === 'image') {
        if (startStyle && startStyle.valueExp && evaluateExpression(value, startStyle.valueExp)) {
          setNodeImageStyle(cell, startStyle);
        } else if (stopStyle && stopStyle.valueExp && evaluateExpression(value, stopStyle.valueExp)) {
          setNodeImageStyle(cell, stopStyle);
        }
      } else {
        if (startStyle && startStyle.valueExp && evaluateExpression(value, startStyle.valueExp)) {
          setNodeStyle(cell, startStyle);
        } else if (stopStyle && stopStyle.valueExp && evaluateExpression(value, stopStyle.valueExp)) {
          setNodeStyle(cell, stopStyle);
        }
      }
    }).catch(error => {
      console.error('Failed to update node style:', error);
    });
  }
  const setNodeStateStyleByRandomData = (cell: Cell, nodeConfig: NodeDataType) => {
    const stopStyle = nodeConfig.stopStyle;
    const startStyle = nodeConfig.startStyle;
    const randomData = generateRandomNumber(nodeConfig.randomConfigure?.minValue, nodeConfig.randomConfigure?.maxValue, 2);
    if (cell.shape === 'image') {
      if (startStyle && startStyle.valueExp && evaluateExpression(randomData, startStyle.valueExp)) {
        setNodeImageStyle(cell, startStyle);
      } else if (stopStyle && stopStyle.valueExp && evaluateExpression(randomData, stopStyle.valueExp)) {
        setNodeImageStyle(cell, stopStyle);
      }
    } else {
      if (startStyle && startStyle.valueExp && evaluateExpression(randomData, startStyle.valueExp)) {
        setNodeStyle(cell, startStyle);
      } else if (stopStyle && stopStyle.valueExp && evaluateExpression(randomData, stopStyle.valueExp)) {
        setNodeStyle(cell, stopStyle);
      }
    }

  }
  const setNodeStateStyleByFixedData = (cell: Cell, nodeConfig: NodeDataType) => {
    const stopStyle = nodeConfig.stopStyle;
    const startStyle = nodeConfig.startStyle;
    const fixedData = nodeConfig.fixedConfigure?.dataValue;
    if (cell.shape === 'image') {
      if (startStyle && startStyle.valueExp && evaluateExpression(fixedData, startStyle.valueExp)) {
        setNodeImageStyle(cell, startStyle);
      } else if (stopStyle && stopStyle.valueExp && evaluateExpression(fixedData, stopStyle.valueExp)) {
        setNodeImageStyle(cell, stopStyle);
      }
    } else {
      if (startStyle && startStyle.valueExp && evaluateExpression(fixedData, startStyle.valueExp)) {
        setNodeStyle(cell, startStyle);
      } else if (stopStyle && stopStyle.valueExp && evaluateExpression(fixedData, stopStyle.valueExp)) {
        setNodeStyle(cell, stopStyle);
      }
    }
  }
  const findNodeConfigData = (nodeId: string, nodeDataConfigs: NodeDataType[]) => {
    if (nodeDataConfigs) {
      const nodeConfigData = nodeDataConfigs.find(nodeConfig => nodeConfig.nodeId === nodeId);
      return nodeConfigData;
    }
  }

  // 定义要执行的任务函数
  const logTask = () => {
    if (!curBoardConfig?.nodeDataConfigs) {
      return;
    }
    const cells = graph?.getCells();

    // 设置node节点的文本或者样式
    cells?.forEach(cell => {
      const nodeConfigData: NodeDataType = findNodeConfigData(cell.id, curBoardConfig?.nodeDataConfigs);
      if (nodeConfigData) {
        const dataSource = nodeConfigData.dataSource;
        if (dataSource === 'IOT' || dataSource === 'API' || dataSource === 'RANDOM' || dataSource === 'FIXED') {
          if (cell.shape === 'static-text-graph') {
            if (dataSource === 'IOT') {
              setTextNodeLabelByIotData(cell, nodeConfigData.iotConfigure);
            } else if (dataSource === 'API') {
              setTextNodeLabelBtApiData(cell, nodeConfigData.apiConfigure, nodeConfigData.textStyle);
            } else if (dataSource === 'RANDOM') {
              setTextNodeLabelBtRandomData(cell, nodeConfigData.randomConfigure, nodeConfigData.textStyle);
            } else if (dataSource === 'FIXED') {
              setTextNodeLabelBtFixedData(cell, nodeConfigData.fixedConfigure, nodeConfigData.textStyle);
            }

          } else if (cell.shape === 'custom-circle' || cell.shape === 'path' || cell.shape === 'custom-rect' || cell.shape === 'custom-text-graph' || cell.shape === 'edge') {
            if (dataSource === 'IOT') {
              setNodeStateStyleByIotData(cell, nodeConfigData);
            } else if (dataSource === 'API') {
              setNodeStateStyleByApiData(cell, nodeConfigData);
            } else if (dataSource === 'RANDOM') {
              setNodeStateStyleByRandomData(cell, nodeConfigData);
            } else if (dataSource === 'FIXED') {
              setNodeStateStyleByFixedData(cell, nodeConfigData);
            }
          } else if (cell.shape === 'image') {
            if (dataSource === 'IOT') {
              setNodeStateStyleByIotData(cell, nodeConfigData);
            } else if (dataSource === 'API') {
              setNodeStateStyleByApiData(cell, nodeConfigData);
            } else if (dataSource === 'RANDOM') {
              setNodeStateStyleByRandomData(cell, nodeConfigData);
            } else if (dataSource === 'FIXED') {
              setNodeStateStyleByFixedData(cell, nodeConfigData);
            }
          }
        }

      }
    });

  };

  // 初始化Graph实例和处理boardConfigure变化
  useEffect(() => {
    // 同步boardConfigure到组件内部状态curBoardConfig
    if (boardConfigure) {
      setCurBoardConfig(boardConfigure);
    }

    // 初始化Graph实例
    if (canvasRef.current) {
      // 创建Graph实例，配置画布参数
      const graphPreview = new Graph({
        container: canvasRef.current,
        panning: false, // 禁用平移
        
        // 网格配置（当前设置为不可见）
        grid: {
          visible: false,
          type: 'doubleMesh',
          args: [
            { color: '#eee', thickness: 1 },
            { color: '#ddd', thickness: 1, factor: 4 },
          ],
        },
        
        // 鼠标滚轮配置（禁用缩放）
        mousewheel: {
          enabled: false,
          zoomAtMousePosition: true,
          modifiers: 'ctrl',
          minScale: 0.5,
          maxScale: 3,
        },
        
        // 交互配置（禁用所有编辑交互）
        interacting: {
          nodeMovable: false,
          edgeMovable: false,
          nodeSelectable: false,
          edgeSelectable: false,
          nodeResizable: false,
          edgeResizable: false,
          arrowheadMovable: false,
          useEdgeTools: false,
          vertexMovable: false,
        },
        
        // 连线配置
        connecting: {
          router: boardConfigure?.router || 'manhattan',
          connector: { name: 'rounded', args: { radius: 8 } },
          anchor: 'center',
          connectionPoint: 'anchor',
          allowBlank: true,
          snap: { radius: 20 },
          
          // 自定义创建Edge
          createEdge() {
            return new Shape.Edge({
              attrs: {
                line: {
                  stroke: '#030303ff',
                  strokeWidth: 2,
                  targetMarker: { name: 'block', width: 12, height: 8 },
                },
              },
              zIndex: 0,
            });
          },
          
          // 验证连接
          validateConnection({ targetMagnet }) {
            return !!targetMagnet;
          },
        },
        
        // 高亮配置
        highlighting: {
          magnetAdsorbed: {
            name: 'stroke',
            args: { attrs: { fill: '#5F95FF', stroke: '#5F95FF' } },
          },
        },
      });

      // 加载画板数据
      loadBoardData(graphPreview);
    }

    return () => {
      // 清理资源：在组件卸载或boardConfigure变化时销毁Graph实例
      if (graph) {
        graph.dispose();
      }
    };
  }, [boardConfigure]);
  return (
    <div >
      <div id="graphPreviewContainer" ref={canvasRef}
        style={{
          width: '100%',    // 可视区域宽度
          height: '900px',   // 可视区域高度
          overflow: 'auto',  // 超过尺寸时显示滚动条
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
        }}
      >
      </div>
      <Modal
        title="设备详情"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isDeviceModalOpen}
        onOk={handleDeviceOk}
        onCancel={handleDeviceCancel}
      >
        <div>
          设备详情: 
        </div>
      </Modal>
      <Drawer
        title="详细信息"
        size={size}
        closable={{ 'aria-label': 'Close Button' }}
        onClose={onClose}
        open={open}
      >
        <iframe
          //src={`http://192.168.1.100:8080/#/device/${deviceId}`}
          src={url}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </Drawer>
    </div>
  );
};

export default PreviewGraph;
