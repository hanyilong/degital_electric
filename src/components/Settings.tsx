import { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { Form, Input, Button, Select, Radio, Card, Image, Switch } from 'antd';
import type { NodeDataType, IotConfigure, ApiConfigure, StyleConfigure, EventConfig, TextStyleConfig, RandomConfig, FixedConfig } from '../graph-context';
import { useCounter, getCellStyle, createAndGetCellData } from '../graph-context';
import { Graph, Cell } from '@antv/x6';
import { getPercentComponentRuntime } from './chart/Percent'
import { getBarChartComponentRuntime } from './chart/BarChart'
import { getLineChartComponentRuntime } from './chart/LineChart'
import { getPieChartComponentRuntime } from './chart/PieChart'
import { getScatterChartComponentRuntime } from './chart/ScatterChart'
import { getTableComponentRuntime } from './chart/Table'
import { getSwitchComponentRuntime } from './chart/Switch';
import { getButtonComponentRuntime } from './chart/Button';
import { getIFrameComponentRuntime } from './chart/IFrame';
import { getVideoComponentRuntime } from './chart/Video';
import { deviceApi, thingModelApi, timeSeriesApi } from '../utils/api.js';
import type { FormProps } from 'antd';
import '../main.css'

interface TabsExampleProps {
  graph: Graph | null;
}
const onFinish: FormProps<NodeDataType>['onFinish'] = (values) => {
  console.log('Success:', values);
};

const onFinishFailed: FormProps<NodeDataType>['onFinishFailed'] = (errorInfo) => {
  console.log('Failed:', errorInfo);
};
function getValueByPath(data: Record<string, any>, path: string): any | undefined {
  // 将路径按点分割成数组
  const pathSegments = path.split('.');

  // 递归或循环查找值
  let current: any = data;
  for (const segment of pathSegments) {
    // 如果当前节点不存在或不是对象，直接返回undefined
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }

    // 进入下一级节点
    current = current[segment];
  }

  return current;
}

/**
 * JSON字符串转对象（带类型安全和异常处理）
 * @param jsonStr 待解析的JSON字符串
 * @param defaultValue 解析失败时的默认值（默认空对象）
 * @returns 解析后的对象 | 默认值
 */
export function parseJson<T = Record<string, any>>(
  jsonStr: string | null | undefined,
  defaultValue: T = {} as T
): T {
  // 处理空值：null/undefined/空字符串直接返回默认值
  if (!jsonStr || jsonStr.trim() === '') {
    return defaultValue;
  }

  try {
    // JSON.parse 核心解析逻辑
    const parsed = JSON.parse(jsonStr);
    // 确保解析结果是对象/数组（排除字符串/数字等原始类型）
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as T;
    }
    return defaultValue;
  } catch (error) {
    console.error('JSON解析失败:', error, '原始字符串:', jsonStr);
    return defaultValue;
  }
}
/**
 * 解析SVG模板中的{{}}公式并计算，返回替换后的SVG字符串
 * @param {string} svgTemplate - 包含{{}}公式的SVG模板字符串
 * @returns {string} 公式计算后的完整SVG字符串
 */
function parseSvgFormula(svgTemplate) {
  // 正则匹配{{}}中的公式（非贪婪匹配，支持任意空格和算术表达式）
  const formulaRegex = /\{\{(.+?)\}\}/g;

  // 替换并计算每个公式
  const parsedSvg = svgTemplate.replace(formulaRegex, (match, formula) => {
    try {
      // 去除公式中的多余空格，执行计算
      const cleanFormula = formula.trim();
      // 仅允许算术运算相关的字符（防止注入风险）
      const safeRegex = /^[\d+\-*/().\s]+$/;
      if (!safeRegex.test(cleanFormula)) {
        throw new Error(`非法公式内容：${cleanFormula}`);
      }
      // 执行公式计算并返回结果
      const result = eval(cleanFormula);
      // 确保返回数值类型（避免非数值结果）
      return typeof result === 'number' ? result : match;
    } catch (error) {
      // 公式计算失败时，保留原{{}}内容并打印错误
      console.error(`公式计算失败：${formula}，错误信息：${error.message}`);
      return match;
    }
  });

  return parsedSvg;
}

const updateSvgNodeStyle = (node: Node, nodeData: any, width: number, height: number) => {
  if (!nodeData || !nodeData.defaultStyle || !nodeData.defaultStyle.svgTemplate) {
    return null;
  }
  const defaultStyle = nodeData.defaultStyle;
  let svgData = defaultStyle.svgTemplate;
  const r = height / 2;
  const cx = width / 2;
  const cy = height / 2;

  // 将svgData中的变量进行替换，比如--width--替换为${height}，--height--替换为${height}
  svgData = svgData.replace(/--width--/g, `${width}`);
  svgData = svgData.replace(/--height--/g, `${height}`);
  svgData = svgData.replace(/--r--/g, `${r}`);
  svgData = svgData.replace(/--cx--/g, `${cx}`);
  svgData = svgData.replace(/--cy--/g, `${cy}`);
  svgData = svgData.replace(/--fillColor--/g, `${defaultStyle.fillColor}`);
  svgData = svgData.replace(/--stroke--/g, `${defaultStyle.stroke}`);
  svgData = svgData.replace(/--strokeWidth--/g, `${defaultStyle.strokeWidth}`);
  svgData = parseSvgFormula(svgData);

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
};

const renderSystemComponentTemplate = (template: string, data: any[]) => {
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

const TabsExample = forwardRef<TabsExampleProps, any>((props, parentRef) => {
  // 状态管理：当前激活的标签索引，0表示第一个标签，1表示第二个标签
  const [activeTab, setActiveTab] = useState(0);
  const [dataActiveKey, setDataActiveKey] = useState('IOT');
  // 状态管理：当前激活的标签索引，0表示什么都没选中，1表示选中的是text组件，2表示选中的是svg或者rect或者circle，3表示选中的是image组件, 4表示选中的是Edge
  const [stateActiveKey, setStateActiveKey] = useState('0');
  // 启用和停用样式切换
  const [stateActiveStyleKey, setStateActiveStyleKey] = useState('stop');
  //  image样式切换
  const [stateActiveImageStyleKey, setStateActiveImageStyleKey] = useState('stop');
  //  edge样式切换
  const [stateActiveEdgeStyleKey, setStateActiveEdgeStyleKey] = useState('stop');
  const [componentActiveStyleKey, setComponentActiveStyleKey] = useState('defaultValue');

  const { count, setDisplayRef, displayRef: currentStoredRef } = useCounter();
  const graph = props.graph;
  const [textStates, setTextStates] = useState<StyleConfigure | null>(null);
  const [stopStyle, setStopStyle] = useState<StyleConfigure | null>(null);
  const [startStyle, setStartStyle] = useState<StyleConfigure | null>(null);
  const [nodeDataSource, setNodeDataSource] = useState<string | null>(null);
  const [apiConfigure, setApiConfigure] = useState<ApiConfigure | null>(null);
  const [iotConfigure, setIotConfigure] = useState<IotConfigure | null>(null);
  const [randomConfigure, setRandomConfigure] = useState<RandomConfig | null>(null);
  const [fixedConfigure, setFixedConfigure] = useState<FixedConfig | null>(null);
  const [textStyleConfig, setTextStyleConfig] = useState<TextStyleConfig | null>(null);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [eventConfigure, setEventConfigure] = useState<EventConfig | null>({ eventType: 'OpenDeviceDetail', eventValue: '123121' });

  // 系统组件配置
  const [systemComponentConfigDefaultValue, setSystemComponentConfigDefaultValue] = useState<string | null>(null);
  const [systemComponentConfigTemplate, setSystemComponentConfigTemplate] = useState<string | null>(null);

  const fontOptions = ['微软雅黑', '宋体', '黑体', 'Arial'];
  const fillOptions = ['蓝色', '白色', '黑色', '红色', '无'];
  const strokeOptions = ['实线', '虚线'];
  const requestMethodOptions = ['GET', 'POST'];
  const dataSourceOptions = [{ id: 'API', name: '接口数据' }, { id: 'IOT', name: '物联数据' }, { id: 'RANDOM', name: '随机数据' }, { id: 'FIXED', name: '固定数据' }];
  const edgeConnectorOptions = [{ id: 'normal', name: '普通' }, { id: 'smooth', name: '平滑' }, { id: 'rounded', name: '圆角' }, { id: 'jumpover', name: '跳线' }];
  const [deviceTypes, setDeviceTypes] = useState([]); // 存储设备类型列表
  const [devices, setDevices] = useState([]); // 存储设备列表  
  const [deviceProperties, setDeviceProperties] = useState([]); // 存储设备属性

  const eventOptions = [{ id: 'OpenDeviceDetail', name: '查看设备' }, { id: 'OpenCamera', name: '查看摄像头' }, { id: 'OpenLinkDrawer', name: '抽屉打开地址' }, { id: 'OpenLinkBlank', name: '弹窗打开地址' }];
  const dataSourceSelectForm = useRef(null);
  const shapeStyleForm = useRef(null);
  const stopStyleForm = useRef(null);
  const startStyleForm = useRef(null);
  const startEdgeForm = useRef(null);
  const stopEdgeForm = useRef(null);
  const stopImageForm = useRef(null);
  const startImageForm = useRef(null);
  const textStyleForm = useRef(null);
  const iotConfigForm = useRef(null);
  const apiConfigForm = useRef(null);
  const randomConfigForm = useRef(null);
  const fixedConfigForm = useRef(null);
  const systemComponentConfigForm = useRef(null);
  const eventConfigForm = useRef(null);



  const showResetTip = () => {
    alert(`计数器已重置！当前值：${count}`);
  };
  const cellSelected = (cell: Cell) => {
    setSelectedCell(cell);
    if (cell) {
      const shape = cell.shape;
      if (shape === 'static-text-graph') {
        setStateActiveKey('1');
      } else if (shape === 'svg-graph' || shape === 'rect' || shape === 'circle' || shape === 'path' || shape === 'svg-embed-node') {
        setStateActiveKey('2');
      } else if (shape === 'image') {
        setStateActiveKey('3');
      } else if (shape === 'edge') {
        setStateActiveKey('4');
      } else if (shape.startsWith('system-component-')) {
        setStateActiveKey('5');
      } else {
        setStateActiveKey('0');
      }

      const nodeData = createAndGetCellData(cell);
      const dataSource = nodeData?.dataSource;
      if (dataSource) {
        setNodeDataSource(dataSource);
        dataSourceSelectForm.current?.setFieldsValue({ "nodeDataSource": dataSource });
      } else {
        const defaultDataSource = dataSourceSelectForm.current?.getFieldsValue().nodeDataSource
        if (defaultDataSource && nodeData) {
          nodeData.dataSource = defaultDataSource;
          setNodeDataSource(defaultDataSource);
        }

      }
      const style = getCellStyle(cell);
      if (style) {
        setTextStates(style);
        shapeStyleForm.current?.setFieldsValue(style);
      }
      const defaultStopStyle = nodeData?.stopStyle;
      if (defaultStopStyle) {
        setStopStyle(defaultStopStyle);
      }
      const defaultStartStyle = nodeData?.startStyle;
      if (defaultStartStyle) {
        setStartStyle(defaultStartStyle);
      }

      const defaultTextConfigStyle = nodeData?.textStyle;
      if (defaultTextConfigStyle) {
        setTextStyleConfig(defaultTextConfigStyle);
        console.log('defaultTextConfigStyle:', defaultTextConfigStyle);

      }

      const apiConfigure = nodeData?.apiConfigure;
      if (apiConfigure) {
        setApiConfigure(apiConfigure);
      } else {
        setApiConfigure({ apiUrl: "", apiMethod: "", apiHeaders: "", apiBody: "", extractPath: "", responseData: "", extractValue: "" });
      }
      const iotConfigure = nodeData?.iotConfigure;
      if (iotConfigure) {
        setIotConfigure(iotConfigure);

      } else {
        setIotConfigure({ projectId: "", deviceTypeId: "", deviceId: "", propertyId: "" });
      }
      const fixedConfigure = nodeData?.fixedConfigure;
      if (fixedConfigure) {
        setFixedConfigure(fixedConfigure);

      } else {
        setFixedConfigure({ dataValue: "" });
      }
      const randomConfigure = nodeData?.randomConfigure;
      if (randomConfigure) {
        setRandomConfigure(randomConfigure);
      } else {
        setRandomConfigure({ maxValue: 100, minValue: 0 });
      }

      const cellEventConfigure = nodeData?.eventConfig;
      if (cellEventConfigure) {
        setEventConfigure(cellEventConfigure);
      } else {
        setEventConfigure({ eventType: 'OpenDeviceDetail', eventValue: '' });
      }
      eventConfigForm.current?.setFieldsValue(cellEventConfigure);

      if (cell.shape.startsWith('system-component-')) {
        let systemComponent = null;
        if (cell.shape === 'system-component-percent') {
          systemComponent = getPercentComponentRuntime(cell)
        } else if (cell.shape === 'system-component-bar') {
          systemComponent = getBarChartComponentRuntime(cell)
        } else if (cell.shape === 'system-component-line') {
          systemComponent = getLineChartComponentRuntime(cell)
        } else if (cell.shape === 'system-component-pie') {
          systemComponent = getPieChartComponentRuntime(cell)
        } else if (cell.shape === 'system-component-scatter') {
          systemComponent = getScatterChartComponentRuntime(cell)
        } else if (cell.shape === 'system-component-table') {
          systemComponent = getTableComponentRuntime(cell)
        } else if (cell.shape === 'system-component-button') {
          systemComponent = getButtonComponentRuntime(cell)
        } else if (cell.shape === 'system-component-switch') {
          systemComponent = getSwitchComponentRuntime(cell)
        } else if (cell.shape === 'system-component-iframe') {
          systemComponent = getIFrameComponentRuntime(cell)
        } else if (cell.shape === 'system-component-video') {
          systemComponent = getVideoComponentRuntime(cell)
        }
        if (systemComponent) {
          const systemComponentConfigProps = systemComponent?.getExposeToNodeProps()
          systemComponentConfigForm.current?.setFieldsValue(systemComponentConfigDefaultValue);
          setSystemComponentConfigDefaultValue(JSON.stringify(systemComponentConfigProps.defaultValue));
          setSystemComponentConfigTemplate(systemComponentConfigProps.template);
        }
      }
    } else {
      setStateActiveKey('0');
      setNodeDataSource(null);
      setTextStates(null);
      setStopStyle(null);
      setStartStyle(null);
      setTextStyleConfig(null);
      setApiConfigure(null);
      setIotConfigure(null);
      setFixedConfigure(null);
      setRandomConfigure(null);
      setSystemComponentConfigDefaultValue(null);
      setSystemComponentConfigTemplate(null);
    }


  };
  const handleCallApi = async () => {
    const values = apiConfigForm.current?.getFieldsValue();
    const url: string = values.apiUrl;
    if (!values.apiHeaders) {
      values.apiHeaders = JSON.stringify({ "content-type": "application/json" });
    }
    const headers: any = JSON.parse(values.apiHeaders);
    const method: string = values.apiMethod ? values.apiMethod : "GET";
    const body: string = values.apiBody;

    if (method === "GET") {
      const response = await fetch(url, {
        method: method,
        headers: headers ? headers : { "content-type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      // 解析JSON响应
      const data = await response.json();
      const responseData = JSON.stringify(data, null, 2);
      handleApiConfigChange("responseData", responseData);
      apiConfigForm.current?.setFieldsValue({ "responseData": responseData });
      console.log('responseData:', responseData);
    } else if (method === "POST") {
      const response = await fetch(url, {
        method: method,
        headers: headers ? headers : { "content-type": "application/json" },
        body: body,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      // 解析JSON响应
      const data = await response.json();
      const responseData = JSON.stringify(data, null, 2);
      handleApiConfigChange("responseData", responseData);
      apiConfigForm.current?.setFieldsValue({ "responseData": responseData });
      console.log('responseData:', responseData);
    }

  };
  const updateCellStyle = (style: StyleConfigure) => {
    const selectedCells = graph?.getSelectedCells();
    const selectedNodes = selectedCells?.filter(cell => cell.isNode());
    if (selectedNodes && selectedNodes.length > 0) {
      selectedNodes.forEach(node => {
        const cellData = node.getData();
        let preStyle = cellData.defaultStyle;
        if (!preStyle) {
          preStyle = {
            font: "微软雅黑",
            color: "#000000",
            size: 12,
            isBold: false,
            isItalic: false,
            isUnderline: false,
          }
        }
        preStyle = { ...preStyle, ...style };
        cellData.defaultStyle = preStyle;
        if (node.shape === 'static-text-graph') {
          const styleCss = "font-family: " + preStyle.font + "; font-size: " + preStyle.size + "pt;font-weight: " + (preStyle.isBold ? "bold" : "normal") + ";font-style: " + (preStyle.isItalic ? "italic" : "normal") + ";text-decoration: " + (preStyle.isUnderline ? "underline" : "none") + ";color: " + preStyle.color;
          const containerId = node?.id + 'container';
          const container = document.getElementById(containerId)!;
          if (container) {
            container.style.cssText = styleCss;
          }
        } else if (node.shape === 'edge') {
          if (style.animation && node.attrs && node.attrs.line) {
            node.attrs.line.strokeDasharray = 15;
            node.attrs.line.strokeDashoffset = 0;
            // 配置并启动动画
            node.animate(
              {
                'attrs/line/strokeDashoffset': -20, // 动画属性：从 -20 到 0 循环
              },
              {
                duration: 2000, // 动画时长
                iterations: Infinity, // 无限循环
                easing: 'linear', // 线性动画（匀速）
              }
            );
            console.log('cell', node)
          }
        } else if (node.shape === 'svg-embed-node') {
          const width = node.size().width;
          const height = node.size().height;
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
        }
        else {
          node?.attr({
            label: {
              fill: preStyle.color,
              fontSize: preStyle.size,
              fontWeight: (preStyle.isBold ? "bold" : "normal"),
              fontStyle: (preStyle.isItalic ? "italic" : "normal"),
            },
            body: {
              fill: preStyle.fillColor,
              stroke: preStyle.stroke,
              strokeWidth: preStyle.strokeWidth,
              strokeDasharray: preStyle.strokeDasharray,
              rx: preStyle.rx,
              ry: preStyle.ry,
            }
          })
        }
      });
    }

    const selectedEdges = selectedCells?.filter(cell => cell.isEdge());
    if (selectedEdges && selectedEdges.length > 0) {
      selectedEdges.forEach(edge => {
        const cellData = edge.getData();
        if (cellData) {
          cellData.defaultStyle = style;
        }
        if (style) {
          edge.attr({
            line: {
              stroke: style.stroke,
              strokeWidth: style.strokeWidth,
              strokeDasharray: style.strokeDasharray,
            },
          });
          edge.setConnector({
            name: style.connector,
            args: {
              // radius: 80,
              // direction: 'bottom'
            }
          });
          if (style.stroke && edge.attrs.line.sourceMarker && typeof edge.attrs.line.sourceMarker != 'string') {
            edge.attrs.line.sourceMarker.fill = style.stroke;
            edge.attrs.line.sourceMarker.stroke = style.stroke;
          }
          if (style.stroke && edge.attrs.line.targetMarker && typeof edge.attrs.line.targetMarker != 'string') {
            edge.attrs.line.targetMarker.fill = style.stroke;
            edge.attrs.line.targetMarker.stroke = style.stroke;
          }


          const edgeDom = document.querySelector(`[data-cell-id="${edge.id}"]`);
          if (!edgeDom) return;
          const toolSourcePaths = document.querySelectorAll('.x6-edge-tool-source-arrowhead');
          toolSourcePaths.forEach(node => {
            const parent = node.parentNode
            const parentId = parent?.getAttribute('data-cell-id')
            if (node.nodeName === 'path' && parentId === edge.id) {
              node.setAttribute('fill', style.stroke);
              node.setAttribute('stroke', 'none');
            }
          });
          const toolTargetPaths = document.querySelectorAll('.x6-edge-tool-target-arrowhead');
          toolTargetPaths.forEach(node => {
            const parent = node.parentNode
            const parentId = parent?.getAttribute('data-cell-id')
            if (node.nodeName === 'path' && parentId === edge.id) {
              node.setAttribute('fill', style.stroke);
              node.setAttribute('stroke', 'none');
            }
          });
        }
      });
    }
  }

  const formatJsonString = (jsonStr: string): string => {
    try {
      const parsedJson = JSON.parse(jsonStr);
      return JSON.stringify(parsedJson, null, 2);
    } catch (error) {
      console.error('JSON格式化失败：', (error as Error).message);
      return '// JSON格式错误，请检查！\n' + jsonStr;
    }
  };

  const handleApiConfigChange = (eventType: string, eventValue: any) => {
    if (eventType === "apiUrl") {
      setApiConfigure(prev => ({ ...prev, apiUrl: eventValue }));
    } else if (eventType === "apiMethod") {
      setApiConfigure(prev => ({ ...prev, apiMethod: eventValue }));
    } else if (eventType === "apiHeaders") {
      setApiConfigure(prev => ({ ...prev, apiHeaders: eventValue }));
    } else if (eventType === "apiBody") {
      setApiConfigure(prev => ({ ...prev, apiBody: eventValue }));
    } else if (eventType === "extractPath") {
      setApiConfigure(prev => ({ ...prev, extractPath: eventValue }));
    } else if (eventType === "responseData") {
      setApiConfigure(prev => ({ ...prev, responseData: eventValue }));
    } else if (eventType === "extractValue") {
      setApiConfigure(prev => ({ ...prev, extractValue: eventValue }));
    }
  };
  const handleEventConfigChange = (eventType: string, eventValue: any) => {
    if (eventType === "eventType") {
      setEventConfigure(prev => ({ ...prev, eventType: eventValue }));
    } else if (eventType === "eventValue") {
      setEventConfigure(prev => ({ ...prev, eventValue: eventValue }));
    }
  }

  const handleFixedConfigChange = (eventType: string, eventValue: any) => {
    if (eventType === "dataValue") {
      setFixedConfigure(prev => ({ ...prev, dataValue: eventValue }));
    }
  };

  const handleRandomConfigChange = (eventType: string, eventValue: any) => {
    if (eventType === "maxValue") {
      setRandomConfigure(prev => ({ ...prev, maxValue: eventValue }));
    } else if (eventType === "minValue") {
      setRandomConfigure(prev => ({ ...prev, minValue: eventValue }));
    }
  };

  const handleSetLableExample = async () => {
    const html = `<div>
      <div style="color:#ccc">Ua:{{ua}}</div>
      <div style="color:#111">Ub:{{ua}}</div>
      <div style="color:#234">Uc:{{ua}}</div>
      </div>
      `
    setTextStyleConfig({ ...textStyleConfig, html: html })
  }

  const handleIotConfigChange = (eventType: string, eventValue: any) => {
    if (eventType === "projectId") {
      setIotConfigure(prev => ({ ...prev, projectId: eventValue }));
    } else if (eventType === "deviceTypeId") {
      setIotConfigure(prev => ({ ...prev, deviceTypeId: eventValue }));
      const fetchDevices = async () => {
        try {
          // 这里应该是实际的API调用：
          const devices = await deviceApi.getByModelId(eventValue);
          setDevices(devices);
        } catch (error) {
          console.error('获取设备列表失败:', error);
        }
      };
      fetchDevices();

      const fetchDeviceProperties = async () => {
        try {
          const model = deviceTypes.find(m => m.id === eventValue);
          // 从物模型中提取所有点位名称
          const pointNames = [];
          // 解析属性
          const attributes = JSON.parse(model.attributes || '{}');
          if (attributes) {
            Object.keys(attributes).forEach(key => {
              pointNames.push({ key, name: attributes[key].name || key });
            });
          }
          setDeviceProperties(pointNames);
        } catch (error) {
          console.error('获取设备列表失败:', error);
        }
      };
      fetchDeviceProperties();
    } else if (eventType === "deviceId") {
      setIotConfigure(prev => ({ ...prev, deviceId: eventValue }));
    } else if (eventType === "propertyId") {
      setIotConfigure(prev => ({ ...prev, propertyId: eventValue }));
    }
  };

  const handleStartStatesChange = (eventType: string, eventValue: any) => {
    if (eventType === "valueExp") {
      setStartStyle(prev => ({ ...prev, valueExp: eventValue }));
    } else if (eventType === "fillColor") {
      setStartStyle(prev => ({ ...prev, fillColor: eventValue }));
    } else if (eventType === "stroke") {
      setStartStyle(prev => ({ ...prev, stroke: eventValue }));
    } else if (eventType === "strokeWidth") {
      setStartStyle(prev => ({ ...prev, strokeWidth: eventValue }));
    }
  };

  const handleSetSystemComponentConfig = (eventType: string, eventValue: any) => {
    if (selectedCell) {
      let component = selectedCell.getData().systemComponentConfig?.componentObj;
      if (!component || !(typeof (component as any).getExposeToNodeProps === 'function')) {
        // 只有在组件不存在时才重新获取，避免重复创建
        if (selectedCell.shape === 'system-component-percent') {
          component = getPercentComponentRuntime(selectedCell);
        } else if (selectedCell.shape === 'system-component-bar') {
          component = getBarChartComponentRuntime(selectedCell);
        } else if (selectedCell.shape === 'system-component-line') {
          component = getLineChartComponentRuntime(selectedCell);
        } else if (selectedCell.shape === 'system-component-scatter') {
          component = getScatterChartComponentRuntime(selectedCell);
        } else if (selectedCell.shape === 'system-component-pie') {
          component = getPieChartComponentRuntime(selectedCell);
        } else if (selectedCell.shape === 'system-component-table') {
          component = getTableComponentRuntime(selectedCell);
        } else if (selectedCell.shape === 'system-component-button') {
          component = getButtonComponentRuntime(selectedCell)
        } else if (selectedCell.shape === 'system-component-switch') {
          component = getSwitchComponentRuntime(selectedCell)
        } else if (selectedCell.shape === 'system-component-iframe') {
          component = getIFrameComponentRuntime(selectedCell)
        } else if (selectedCell.shape === 'system-component-video') {
          component = getVideoComponentRuntime(selectedCell)
        }
      }

      // 只有在组件存在时才更新配置，避免无效操作
      if (component) {
        if (eventType === 'systemComponentPropsDefaultValue') {
          // 只有当值真正变化时才更新状态
          setSystemComponentConfigDefaultValue(eventValue);
          const componentDefaultValue = JSON.parse(eventValue);
          const nodeProps = { defaultValue: componentDefaultValue }
          component.setExposeToNodeProps(nodeProps);
        } else if (eventType === 'systemComponentPropsTemplate') {
          // 只有当值真正变化时才更新状态
          setSystemComponentConfigTemplate(eventValue);
          const nodeProps = { template: eventValue }
          // 模板变化的时候，如果API相关配置也可用，则根据API数据和模板生成数据，并更新到组件中
          const data = apiConfigure?.responseData
          if (data) {
            try {
              const dataJson = JSON.parse(data)
              const componentDefaultValue = renderSystemComponentTemplate(eventValue, dataJson.data);
              if (componentDefaultValue) {
                nodeProps.defaultValue = componentDefaultValue
              }
            } catch (error) {
              console.error('模板渲染失败:', error);
            }
          }
          component.setExposeToNodeProps(nodeProps);
        }
      }
    }
  }



  const handleNodeConfigChange = (eventType: string, eventValue: any) => {
    setDataActiveKey(eventValue);
    setNodeDataSource(eventValue);
  }

  const handleStopStatesChange = (eventType: string, eventValue: any) => {
    if (eventType === "valueExp") {
      setStopStyle(prev => ({ ...prev, valueExp: eventValue }));
    } else if (eventType === "fillColor") {
      setStopStyle(prev => ({ ...prev, fillColor: eventValue }));
    } else if (eventType === "stroke") {
      setStopStyle(prev => ({ ...prev, stroke: eventValue }));
    } else if (eventType === "strokeWidth") {
      setStopStyle(prev => ({ ...prev, strokeWidth: eventValue }));
    }
  };



  const handleTextStatesChange = (eventType: string, eventValue: any) => {
    if (eventType === "font") {
      setTextStates(prev => ({ ...prev, font: eventValue }));
    } else if (eventType === "color") {
      setTextStates(prev => ({ ...prev, color: eventValue }));
    } else if (eventType === "size") {
      setTextStates(prev => ({ ...prev, size: eventValue }));
    } else if (eventType === "isBold") {
      setTextStates(prev => ({ ...prev, isBold: !prev?.isBold }));
    } else if (eventType === "isItalic") {
      setTextStates(prev => ({ ...prev, isItalic: !prev?.isItalic }));
    } else if (eventType === "isUnderline") {
      setTextStates(prev => ({ ...prev, isUnderline: !prev?.isUnderline }));
    } else if (eventType === "fillColor") {
      if (eventValue === '无') {
        eventValue = 'none';
      } else if (eventValue === '蓝色') {
        eventValue = '#0000ff';
      } else if (eventValue === '白色') {
        eventValue = '#ffffff';
      } else if (eventValue === '黑色') {
        eventValue = '#000000';
      } else if (eventValue === '红色') {
        eventValue = '#ff0000';
      }
      setTextStates(prev => ({ ...prev, fillColor: eventValue }));
    } else if (eventType === "stroke") {
      setTextStates(prev => ({ ...prev, stroke: eventValue }));
    } else if (eventType === "strokeWidth") {
      setTextStates(prev => ({ ...prev, strokeWidth: eventValue }));
    } else if (eventType === "strokeDasharray") {
      if (eventValue === '实线') {
        eventValue = 'none';
      } else if (eventValue === '虚线') {
        eventValue = '20,15';
      }
      setTextStates(prev => ({ ...prev, strokeDasharray: eventValue }));
    } else if (eventType === "selectEnable") {
      setTextStates(prev => ({ ...prev, selectEnable: eventValue }));
    } else if (eventType === "connector") {
      setTextStates(prev => ({ ...prev, connector: eventValue }));
    } else if (eventType === "animation") {
      setTextStates(prev => ({ ...prev, animation: eventValue }));
    } else if (eventType === "rx") {
      setTextStates(prev => ({ ...prev, rx: eventValue }));
    } else if (eventType === "ry") {
      setTextStates(prev => ({ ...prev, ry: eventValue }));
    }


  };

  useEffect(() => {
    if (selectedCell) {
      const cellData = createAndGetCellData(selectedCell);
      cellData.fixedConfigure = fixedConfigure;
      fixedConfigForm.current?.setFieldsValue(fixedConfigure);
    }
  }, [fixedConfigure]);

  useEffect(() => {
    if (selectedCell) {
      const cellData = createAndGetCellData(selectedCell);
      cellData.randomConfigure = randomConfigure;
      randomConfigForm.current?.setFieldsValue(randomConfigure);
    }
  }, [randomConfigure]);

  useEffect(() => {
    if (selectedCell) {
      const cellData = createAndGetCellData(selectedCell);
      cellData.iotConfigure = iotConfigure;
      iotConfigForm.current?.setFieldsValue(iotConfigure);
    }
  }, [iotConfigure]);
  useEffect(() => {
    if (selectedCell) {
      const cellData = createAndGetCellData(selectedCell);
      cellData.apiConfigure = apiConfigure;
      apiConfigForm.current?.setFieldsValue(apiConfigure);
    }
  }, [apiConfigure]);
  useEffect(() => {
    if (selectedCell) {
      const cellData = createAndGetCellData(selectedCell);
      cellData.stopStyle = stopStyle;
      stopStyleForm.current?.setFieldsValue(stopStyle);
      stopImageForm.current?.setFieldsValue(stopStyle);
      stopEdgeForm.current?.setFieldsValue(stopStyle);

    }
  }, [stopStyle]);
  useEffect(() => {
    if (selectedCell) {
      const cellData = createAndGetCellData(selectedCell);
      cellData.startStyle = startStyle;
      startStyleForm.current?.setFieldsValue(startStyle);
      startImageForm.current?.setFieldsValue(startStyle);
      startEdgeForm.current?.setFieldsValue(startStyle);
    }
  }, [startStyle]);


  useEffect(() => {
    if (selectedCell) {
      const cellData = createAndGetCellData(selectedCell);
      cellData.textStyle = textStyleConfig;
      if (selectedCell.isNode() && selectedCell.shape === 'static-text-graph') {
        const nodeContainer = document.getElementById(selectedCell.id + 'container');
        nodeContainer.innerHTML = textStyleConfig?.html;
        textStyleForm.current?.setFieldsValue(textStyleConfig);
      }
    }
  }, [textStyleConfig]);

  useEffect(() => {
    // 只有当textStates存在且有变化时才更新，避免无限循环
    if (textStates && selectedCell) {
      updateCellStyle(textStates);
      const cellData = createAndGetCellData(selectedCell);
      cellData.defaultStyle = textStates;
      selectedCell.setProp('selectable', textStates?.selectEnable);
    }
  }, [textStates, selectedCell]);

  useEffect(() => {
    if (selectedCell && nodeDataSource) {
      const cellData = createAndGetCellData(selectedCell);
      cellData.dataSource = nodeDataSource;
      setDataActiveKey(nodeDataSource);
    }
  }, [nodeDataSource, selectedCell]);

  useEffect(() => {
    if (dataActiveKey === 'API') {
      apiConfigForm.current?.setFieldsValue(apiConfigure);
    } else if (dataActiveKey === 'IOT') {
      iotConfigForm.current?.setFieldsValue(iotConfigure);
      const fetchDeviceTypes = async () => {
        try {
          const thingModels = await thingModelApi.getAll();
          await new Promise(resolve => setTimeout(resolve, 500));
          setDeviceTypes(thingModels);
        } catch (error) {
          console.error('获取设备类型失败:', error);
        }
      };
      fetchDeviceTypes();
    } else if (dataActiveKey === 'RANDOM') {
      randomConfigForm.current?.setFieldsValue(randomConfigure);
    } else if (dataActiveKey === 'FIXED') {
      fixedConfigForm.current?.setFieldsValue(fixedConfigure);
    }
  }, [dataActiveKey]);

  useEffect(() => {
    if (selectedCell) {
      const cellData = createAndGetCellData(selectedCell);
      cellData.eventConfig = eventConfigure;
    }

  }, [eventConfigure]);

  useEffect(() => {
    if (stateActiveImageStyleKey === 'stop') {
      stopImageForm.current?.setFieldsValue(stopStyle);
    } else if (stateActiveImageStyleKey === 'start') {
      startImageForm.current?.setFieldsValue(startStyle);
    }
  }, [stateActiveImageStyleKey]);
  useEffect(() => {
    if (stateActiveStyleKey === 'stop') {
      stopStyleForm.current?.setFieldsValue(stopStyle);
    } else if (stateActiveStyleKey === 'start') {
      startStyleForm.current?.setFieldsValue(startStyle);
    }
  }, [stateActiveStyleKey]);

  useEffect(() => {
    if (stateActiveEdgeStyleKey === 'stop') {
      stopEdgeForm.current?.setFieldsValue(stopStyle);
    } else if (stateActiveEdgeStyleKey === 'start') {
      startEdgeForm.current?.setFieldsValue(startStyle);
    }
  }, [stateActiveEdgeStyleKey]);
  // 标签数据
  const tabs = [
    {
      id: 'tab1',
      title: '样式',
      content: (
        <div className="image-display-form">
          <Form ref={shapeStyleForm}
            name="basic"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 18 }}
            style={{ maxWidth: 600 }}
            initialValues={{ remember: true }}
            autoComplete="off"
          >
            <div className="panel">
              <div className="control-group">
                <div className="stroke-row">
                  <label>字体</label>
                  <Form.Item<StyleConfigure>
                    label=""
                    name="font"
                  >

                    <select value={textStates?.font} onChange={(e) => handleTextStatesChange("font", e.target?.value)}>
                      {fontOptions.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </Form.Item>

                </div>
                <div className="stroke-row">
                  <label>颜色</label>
                  <Form.Item<StyleConfigure>
                    label=""
                    name="color"
                  >
                    <input type="color" value={textStates?.color} onChange={(e) => handleTextStatesChange("color", e.target.value)} />
                  </Form.Item>
                </div>
                <div className="stroke-row">
                  <label>大小</label>
                  <Form.Item<StyleConfigure>
                    label=""
                    name="size"
                  >
                    <input
                      type="number"
                      placeholder=""
                      value={textStates?.size}
                      onChange={(e) => handleTextStatesChange("size", e.target.value)}
                    /></Form.Item>

                </div>
                <div className="text-row">
                  <button
                    className={textStates?.isBold ? 'active' : ''}
                    onClick={() => handleTextStatesChange("isBold", !textStates?.isBold)}
                  >B</button>
                  <button
                    className={textStates?.isItalic ? 'active' : ''}
                    onClick={() => handleTextStatesChange("isItalic", !textStates?.isItalic)}
                  >I</button>
                  <button
                    className={textStates?.isUnderline ? 'active' : ''}
                    onClick={() => handleTextStatesChange("isUnderline", !textStates?.isUnderline)}
                  >U</button>
                </div>
              </div>
            </div>
            <div className="control-group">
              <h3>填充</h3>
              <div className="fill-row">
                <Form.Item<StyleConfigure>
                  label=""
                  name="fillColor"
                >
                  <select onChange={(e) => handleTextStatesChange("fillColor", e.target.value)}>
                    {fillOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select></Form.Item>
                <Form.Item<StyleConfigure>
                  label=""
                  name="fillColor"
                >
                  <input type="color" value={textStates?.fillColor} onChange={(e) => handleTextStatesChange("fillColor", e.target.value)} /></Form.Item>
              </div>
            </div>
            <div className="control-group">
              <h3>线条</h3>

              <div className="stroke-row">
                <label>类型</label>
                <Form.Item<StyleConfigure>
                  label=""
                  name="strokeDasharray"
                >
                  <select onChange={(e) => handleTextStatesChange("strokeDasharray", e.target.value)}>
                    {strokeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select></Form.Item>
              </div>
              <div className="stroke-row">
                <label>颜色</label>
                <Form.Item<StyleConfigure>
                  label=""
                  name="stroke"
                >
                  <input type="color" value={textStates?.stroke} onChange={(e) => handleTextStatesChange("stroke", e.target.value)} />
                </Form.Item>
              </div>
              <div className="stroke-row">
                <label>粗细</label>
                <Form.Item<StyleConfigure>
                  label=""
                  name="strokeWidth"
                >

                  <input
                    type="number"
                    placeholder="粗细"
                    onChange={(e) => handleTextStatesChange("strokeWidth", e.target.value)}
                    value={textStates?.strokeWidth}
                  />
                </Form.Item>
              </div>
              <div className="stroke-row">
                <label>x弧度</label>
                <Form.Item<StyleConfigure>
                  label=""
                  name="rx"
                >

                  <input
                    type="number"
                    placeholder="x弧度"
                    onChange={(e) => handleTextStatesChange("rx", e.target.value)}
                    value={textStates?.rx}
                  />
                </Form.Item>
              </div>
              <div className="stroke-row">
                <label>y弧度</label>
                <Form.Item<StyleConfigure>
                  label=""
                  name="ry"
                >

                  <input
                    type="number"
                    placeholder="y弧度"
                    onChange={(e) => handleTextStatesChange("ry", e.target.value)}
                    value={textStates?.ry}
                  />
                </Form.Item>
              </div>
              <div className="stroke-row">
                <label>连接器</label>
                <Form.Item<StyleConfigure>
                  label=""
                  name="connector"
                >

                  <select onChange={(e) => handleTextStatesChange("connector", e.target.value)}>
                    {edgeConnectorOptions.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </Form.Item>
              </div>
            </div>
            <div style={{ margin: 10 }} /> <br />
          </Form>
        </div>
      )
    },
    {
      id: 'tab2',
      title: '数据',
      content: (
        <div className="image-display-form">
          <div style={{
            position: 'relative', // 确保卡片在同一位置渲染
            height: 400, // 固定容器高度（避免切换时布局跳动）
          }}>
            {stateActiveKey === '0' && (
              <Card title="" style={{ height: '100%' }}>
                没有选中节点
              </Card>
            )}
            {stateActiveKey === '1' && (
              <Card title="" style={{ height: '100%', padding: 0 }}>
                <Form
                  ref={textStyleForm}
                  name="textStylesForm"
                  labelCol={{ span: 8 }}
                  wrapperCol={{ span: 18 }}
                  style={{ maxWidth: 600 }}
                  initialValues={{ remember: true }}
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  autoComplete="off"
                >
                  <div className="control-group">
                    <Form.Item<TextStyleConfig> style={{ marginBottom: 10 }}
                      name="html"
                    >
                      <div style={{ width: 180 }}>
                        <Input.TextArea rows={8} placeholder='<div>
<div style="color: #ccc">Ia:{{ua}}</div>
<div style="color: #239edd">Ib:{{ub}}</div>
</div>'
                          value={textStyleConfig?.html} onChange={(e) => setTextStyleConfig({ ...textStyleConfig, html: e.target.value })}
                        />
                      </div>
                      <Button onClick={handleSetLableExample}>例子</Button>
                    </Form.Item>
                  </div>
                </Form>
              </Card>
            )}
            {stateActiveKey === '2' && (
              <Card title="" style={{ height: '100%', padding: 0, margin: 0 }} >
                <Radio.Group
                  value={stateActiveStyleKey}
                  onChange={e => setStateActiveStyleKey(e.target.value)}
                  style={{ marginTop: 16 }} // 与卡片保持间距
                >
                  <Radio.Button value="stop">停用</Radio.Button>
                  <Radio.Button value="start">启用</Radio.Button>
                </Radio.Group>
                <div style={{
                  position: 'relative', // 确保卡片在同一位置渲染
                  height: 250, // 固定容器高度（避免切换时布局跳动）
                }}>
                  {/* 卡片1：仅当 activeKey 为 'stop' 且当前shappe是svg时显示 */}
                  {stateActiveStyleKey === 'stop' && (
                    <Card title="" style={{ height: '100%', padding: 0, margin: 0 }}>
                      <Form ref={stopStyleForm}
                        name="stopStyleForm"
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 18 }}
                        style={{ maxWidth: 600 }}
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                      >
                        <div className="stroke-row">
                          <label>状态值</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="valueExp"
                          ><input
                              type="string"
                              value={stopStyle?.valueExp} onChange={(e) => handleStopStatesChange("valueExp", e.target.value)}
                              style={{ width: 40 }}
                            />
                          </Form.Item>

                        </div>
                        <div className="stroke-row">
                          <label>填充色</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="fillColor"
                          >
                            <input type="color" value={stopStyle?.fillColor} onChange={(e) => handleStopStatesChange("fillColor", e.target.value)} />
                          </Form.Item>
                        </div>
                        <div className="stroke-row">
                          <label>线条色</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="stroke"
                          >
                            <input type="color" value={stopStyle?.stroke} onChange={(e) => handleStopStatesChange("stroke", e.target.value)} /></Form.Item>
                        </div>
                        <div className="stroke-row">
                          <label>线条粗</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="strokeWidth"
                          >
                            <input
                              type="number"
                              value={stopStyle?.strokeWidth} onChange={(e) => handleStopStatesChange("strokeWidth", e.target.value)}
                            /></Form.Item>
                        </div>
                      </Form>
                    </Card>
                  )}

                  {/* 卡片2：仅当 activeKey 为 'start'且当前shappe是svg 时显示 */}
                  {stateActiveStyleKey === 'start' && (
                    <Card title="" style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0, padding: 0, margin: 0 }}>
                      <Form
                        ref={startStyleForm}
                        name="startStylesForm"
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 18 }}
                        style={{ maxWidth: 600 }}
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                      >
                        <div className="stroke-row">
                          <label>状态值</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="valueExp"
                          ><input
                              type="string"
                              value={startStyle?.valueExp} onChange={(e) => handleStartStatesChange("valueExp", e.target.value)}
                              style={{ width: 40 }}
                            />
                          </Form.Item>

                        </div>
                        <div className="stroke-row">
                          <label>填充色</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="fillColor"
                          >
                            <input type="color" value={startStyle?.fillColor} onChange={(e) => handleStartStatesChange("fillColor", e.target.value)} /></Form.Item>
                        </div>
                        <div className="stroke-row">
                          <label>线条色</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="stroke"
                          >
                            <input type="color" value={startStyle?.stroke} onChange={(e) => handleStartStatesChange("stroke", e.target.value)} /></Form.Item>
                        </div>
                        <div className="stroke-row">
                          <label>线条粗细</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="strokeWidth"
                          >
                            <input
                              type="number"
                              value={startStyle?.strokeWidth} onChange={(e) => handleStartStatesChange("strokeWidth", e.target.value)}
                            /></Form.Item>
                        </div>
                      </Form>

                    </Card>
                  )}
                </div>
              </Card>
            )}
            {stateActiveKey === '3' && (
              <Card title="" style={{ height: '100%', padding: 0 }}>
                <Radio.Group
                  value={stateActiveImageStyleKey}
                  onChange={e => setStateActiveImageStyleKey(e.target.value)}
                  style={{ marginTop: 16 }} // 与卡片保持间距
                >
                  <Radio.Button value="stop">停用</Radio.Button>
                  <Radio.Button value="start">启用</Radio.Button>
                </Radio.Group>
                <div style={{
                  position: 'relative', // 确保卡片在同一位置渲染
                  height: 250, // 固定容器高度（避免切换时布局跳动）
                }}>
                  {/* 卡片1：仅当 activeKey 为 'stop' 且当前shappe是svg时显示 */}
                  {stateActiveImageStyleKey === 'stop' && (
                    <Card title="" style={{ height: '100%' }}>
                      <Form ref={stopImageForm}
                        name="stopImageForm"
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 18 }}
                        style={{ maxWidth: 600 }}
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                      >
                        <div className="stroke-row">
                          <label>状态值</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="valueExp"
                          ><input
                              type="string"
                              value={stopStyle?.valueExp} onChange={(e) => handleStopStatesChange("valueExp", e.target.value)}
                              style={{ width: 40 }}
                            />
                          </Form.Item>
                        </div>
                        <div className="stroke-row">
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="imageUrl"
                          >
                            <Image
                              width={150}
                              height={150}
                              src={stopStyle?.imageUrl}
                            />
                          </Form.Item>
                        </div>
                      </Form>
                    </Card>
                  )}

                  {/* 卡片2：仅当 activeKey 为 'start'且当前shappe是svg 时显示 */}
                  {stateActiveImageStyleKey === 'start' && (
                    <Card title="" style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0, padding: 0 }}>
                      <Form
                        ref={startImageForm}
                        name="startImageForm"
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 18 }}
                        style={{ maxWidth: 600 }}
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                      >
                        <div className="stroke-row">
                          <label>状态值</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="valueExp"
                          ><input
                              type="string"
                              value={startStyle?.valueExp} onChange={(e) => handleStartStatesChange("valueExp", e.target.value)}
                              style={{ width: 40 }}
                            />
                          </Form.Item>
                        </div>
                        <div className="stroke-row">
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="imageUrl"
                          >
                            <Image
                              width={150}
                              height={150}
                              src={startStyle?.imageUrl}
                            />
                          </Form.Item>
                        </div>
                      </Form>
                    </Card>
                  )}
                </div>
              </Card>
            )}
            {stateActiveKey === '4' && (
              <Card title="" style={{ height: '100%', padding: 0 }}>
                <Radio.Group
                  value={stateActiveEdgeStyleKey}
                  onChange={e => setStateActiveEdgeStyleKey(e.target.value)}
                  style={{ marginTop: 16 }} // 与卡片保持间距
                >
                  <Radio.Button value="stop">停用</Radio.Button>
                  <Radio.Button value="start">启用</Radio.Button>
                </Radio.Group>
                <div style={{
                  position: 'relative', // 确保卡片在同一位置渲染
                  height: 250, // 固定容器高度（避免切换时布局跳动）
                }}>
                  {/* 卡片1：仅当 activeKey 为 'stop' 且当前shappe是svg时显示 */}
                  {stateActiveEdgeStyleKey === 'stop' && (
                    <Card title="" style={{ height: '100%', padding: 0, margin: 0 }}>
                      <Form ref={stopEdgeForm}
                        name="stopEdgeForm"
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 18 }}
                        style={{ maxWidth: 600 }}
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                      >
                        <div className="stroke-row">
                          <label>状态值</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="valueExp"
                          ><input
                              type="string"
                              value={stopStyle?.valueExp} onChange={(e) => handleStopStatesChange("valueExp", e.target.value)}
                              style={{ width: 40 }}
                            />
                          </Form.Item>
                        </div>
                        <div className="stroke-row">
                          <label>线条色</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="stroke"
                          >
                            <input type="color" value={startStyle?.stroke} onChange={(e) => handleStopStatesChange("stroke", e.target.value)} /></Form.Item>
                        </div>
                        <div className="stroke-row">
                          <label>动画</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="animation"
                          >
                            <Switch defaultChecked onChange={(e) => handleStopStatesChange("animation", e)} />
                          </Form.Item>
                        </div>
                      </Form>
                    </Card>
                  )}

                  {/* 卡片2：仅当 activeKey 为 'start'且当前shappe是svg 时显示 */}
                  {stateActiveEdgeStyleKey === 'start' && (
                    <Card title="" style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0, padding: 0, margin: 0 }}>
                      <Form
                        ref={startEdgeForm}
                        name="startEdgeForm"
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 18 }}
                        style={{ maxWidth: 600 }}
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                      >
                        <div className="stroke-row">
                          <label>状态值</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="valueExp"
                          ><input
                              type="string"
                              value={startStyle?.valueExp} onChange={(e) => handleStartStatesChange("valueExp", e.target.value)}
                              style={{ width: 40 }}
                            />
                          </Form.Item>
                        </div>
                        <div className="stroke-row">
                          <label>线条色</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="stroke"
                          >
                            <input type="color" value={startStyle?.stroke} onChange={(e) => handleStartStatesChange("stroke", e.target.value)} />
                          </Form.Item>
                        </div>
                        <div className="stroke-row">
                          <label>动画</label>
                          <Form.Item<StyleConfigure> style={{ marginBottom: 10 }}
                            label=""
                            name="animation"
                          >
                            <Switch defaultChecked onChange={(e) => handleStartStatesChange("stroke", e)} />
                          </Form.Item>
                        </div>
                      </Form>
                    </Card>
                  )}
                </div>
              </Card>
            )}
            {stateActiveKey === '5' && (

              <Card title="" style={{ height: '100%', padding: 0 }}>
                <Form
                  ref={systemComponentConfigForm}
                  name="systemComponentConfigForm"
                  labelCol={{ span: 8 }}
                  wrapperCol={{ span: 18 }}
                  style={{ maxWidth: 600 }}
                  initialValues={{ remember: true }}
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  autoComplete="off"
                >
                  <Radio.Group
                    value={componentActiveStyleKey}
                    onChange={e => setComponentActiveStyleKey(e.target.value)}
                    style={{ marginTop: 0 }} // 与卡片保持间距
                  >
                    <Radio.Button value="defaultValue">默认值</Radio.Button>
                    <Radio.Button value="template">模板</Radio.Button>
                  </Radio.Group>
                  <div style={{
                    position: 'relative', // 确保卡片在同一位置渲染
                    height: 310, // 固定容器高度（避免切换时布局跳动）
                  }}>
                    {/* 卡片1：仅当 activeKey 为 'stop' 且当前shappe是svg时显示 */}
                    {componentActiveStyleKey === 'defaultValue' && (
                      <Card title="" style={{ height: '100%', padding: 0, margin: 0 }}>
                        <div className="control-group">
                          <Form.Item style={{ marginBottom: 10 }}
                            name="systemComponentPropsDefaultValue"
                          >
                            <div className="my-json-editor" style={{
                              width: 180, height: 300, overflow: 'auto',
                              position: 'relative'
                            }}>
                              <Input.TextArea rows={13} placeholder=''
                                value={systemComponentConfigDefaultValue}
                                onChange={(e) => setSystemComponentConfigDefaultValue(e.target.value)}
                              />
                              {/* <VanillaJSONEditor
                                content={systemComponentConfigDefaultValueJson}
                                readOnly={false}
                                // onChange={(content) => handleSetSystemComponentConfig("systemComponentPropsDefaultValue", content.text)}
                                mode="text"
                                mainMenuBar={false}
                                navigationBar={false}
                                statusBar={false}
                                flattenColumns={false}
                                allowedModes={['text']}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  fontSize: '12px' // 可选：缩小字体适配小容器
                                }}
                                textOptions={{
                                  lineNumbers: false
                                }}
                              /> */}
                            </div>
                          </Form.Item>
                        </div>
                      </Card>

                    )}
                    {componentActiveStyleKey === 'template' && (
                      <Card title="" style={{ height: '100%', padding: 0, margin: 0 }}>
                        <div className="control-group">
                          <Form.Item style={{ marginBottom: 10 }}
                            name="systemComponentPropsTemplate"
                          >
                            <div className="my-json-editor" style={{
                              width: 180, height: 300, overflow: 'auto',
                              position: 'relative'
                            }}>
                              <Input.TextArea rows={13} placeholder=''
                                value={systemComponentConfigTemplate}
                                onChange={(e) => setSystemComponentConfigTemplate(e.target.value)}
                              />
                            </div>
                          </Form.Item>
                        </div>
                      </Card>
                    )}
                  </div>
                </Form>
                <div>
                  {(componentActiveStyleKey === 'defaultValue') && <Button onClick={() => {
                    if (componentActiveStyleKey === 'defaultValue') {
                      const formatJS = formatJsonString(systemComponentConfigDefaultValue);
                      setSystemComponentConfigDefaultValue(formatJS)
                    } else {
                      const formatJS = formatJsonString(systemComponentConfigTemplate);
                      setSystemComponentConfigDefaultValue(formatJS)
                    }
                  }}>格式化</Button>}
                  <Button onClick={() => {
                    if (componentActiveStyleKey === 'defaultValue') {
                      handleSetSystemComponentConfig("systemComponentPropsDefaultValue", systemComponentConfigDefaultValue)
                    } else {
                      handleSetSystemComponentConfig("systemComponentPropsTemplate", systemComponentConfigTemplate)
                    }
                  }}>
                    应用
                  </Button>
                </div>
              </Card>

            )}
          </div>

          <div>
            <Form ref={dataSourceSelectForm}
              name="dataSourceSelectForm"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 18 }}
              style={{ maxWidth: 600 }}
              initialValues={{ remember: true }}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
            >
              <Form.Item style={{ marginBottom: 10 }}
                label="数据源"
                name="nodeDataSource"
              >
                <Select value={nodeDataSource} onChange={(e) => handleNodeConfigChange("nodeDataSource", e)}
                  style={{ width: 120 }}>
                  {dataSourceOptions.map(f => (
                    <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

            </Form>
          </div>
          {/* 卡片容器：固定位置，通过条件渲染切换显示 */}
          <div style={{
            position: 'relative', // 确保卡片在同一位置渲染
            height: 400, // 固定容器高度（避免切换时布局跳动）
          }}>
            {/* 卡片1：仅当 activeKey 为 'card1' 时显示 */}
            {dataActiveKey === 'IOT' && (
              <Card title="" style={{ height: '100%' }}>
                <Form
                  ref={iotConfigForm}
                  name="iotConfigForm"
                  labelCol={{ span: 8 }}
                  wrapperCol={{ span: 18 }}
                  style={{ maxWidth: 600 }}
                  initialValues={{ remember: true }}
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  autoComplete="off"
                >
                  <Form.Item<IotConfigure> style={{ marginBottom: 10 }}
                    label="设备类型"
                    name="deviceTypeId"
                  >
                    <Select value={iotConfigure?.deviceTypeId} onChange={(e) => handleIotConfigChange("deviceTypeId", e)}
                      style={{ width: 120 }}>
                      {deviceTypes.map(f => (
                        <Select.Option key={f.id} value={f.id}>{f.modelName}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item<IotConfigure> style={{ marginBottom: 10 }}
                    label="设备"
                    name="deviceId"
                  >
                    <Select value={iotConfigure?.deviceId} onChange={(e) => handleIotConfigChange("deviceId", e)}
                      style={{ width: 120 }}>
                      {devices.map(device => (
                        <Select.Option key={device.id} value={device.deviceCode}>{device.deviceName}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item<IotConfigure> style={{ marginBottom: 10 }}
                    label="属性"
                    name="propertyId"
                  >
                    <Select value={iotConfigure?.propertyId} onChange={(e) => handleIotConfigChange("propertyId", e)}
                      style={{ width: 120 }}>
                      {deviceProperties.map(f => (
                        <Select.Option key={f.key} value={f.key}>{f.name}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item<IotConfigure>
                    label="提取值"
                  >
                    {iotConfigure?.lastValue}
                  </Form.Item>
                </Form>
              </Card>
            )}

            {/* 卡片2：仅当 activeKey 为 'card2' 时显示 */}
            {dataActiveKey === 'API' && (
              <Card title="" style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0 }}>
                <Form
                  ref={apiConfigForm}
                  name="apiConfigForm"
                  labelCol={{ span: 8 }}
                  wrapperCol={{ span: 18 }}
                  style={{ maxWidth: 600 }}
                  initialValues={{ remember: true }}
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  autoComplete="off"
                >
                  <Form.Item<ApiConfigure> style={{ marginBottom: 10 }}
                    label="地址"
                    name="apiUrl"
                  >
                    <Input placeholder="输入服务地址" value={apiConfigure?.apiUrl} onChange={(e) => handleApiConfigChange("apiUrl", e.target.value)} />
                  </Form.Item>
                  <Form.Item<ApiConfigure> style={{ marginBottom: 10 }}
                    label="请求"
                    name="apiMethod"
                  >
                    <Select value={apiConfigure?.apiMethod} onChange={(e) => handleApiConfigChange("apiMethod", e)}
                      style={{ width: 120 }}>
                      {requestMethodOptions.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item<ApiConfigure> style={{ marginBottom: 10 }}
                    label="请求头"
                    name="apiHeaders"
                  >
                    <Input.TextArea rows={2} value={apiConfigure?.apiHeaders} onChange={(e) => handleApiConfigChange("apiHeaders", e.target.value)} />
                  </Form.Item>
                  <Form.Item<ApiConfigure> style={{ marginBottom: 10 }}
                    label="请求体"
                    name="apiBody"
                  >
                    <Input.TextArea rows={2} value={apiConfigure?.apiBody} onChange={(e) => handleApiConfigChange("apiBody", e.target.value)} />
                  </Form.Item>
                  <Button onClick={handleCallApi}>测试</Button>
                  <Form.Item<ApiConfigure> style={{ marginBottom: 10 }}
                    label="返回值"
                    name="responseData"
                  >
                    <Input.TextArea rows={2} value={apiConfigure?.responseData} onChange={(e) => handleApiConfigChange("responseData", e.target.value)} />
                  </Form.Item>
                  {/* <Form.Item<ApiConfigure> style={{ marginBottom: 10 }}
                    label="取值"
                    name="extractPath"
                  >
                    <Input placeholder="输入提取路径" value={apiConfigure?.extractPath} onChange={(e) => handleApiConfigChange("extractPath", e.target.value)} />
                  </Form.Item><Button onClick={handleExtract}>测试</Button>
                  <p>
                    提取值：{apiConfigure?.extractValue}
                  </p> */}
                </Form>
              </Card>
            )}
            {/* 卡片2：仅当 activeKey 为 'card2' 时显示 */}
            {dataActiveKey === 'RANDOM' && (
              <Card title="" style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0 }}>
                <Form
                  ref={randomConfigForm}
                  name="randomConfigForm"
                  labelCol={{ span: 8 }}
                  wrapperCol={{ span: 18 }}
                  style={{ maxWidth: 600 }}
                  initialValues={{ remember: true }}
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  autoComplete="off"
                >
                  <Form.Item<RandomConfig> style={{ marginBottom: 10 }}
                    label="最大值"
                    name="maxValue"
                  >
                    <Input type="number" placeholder="输入最大值" value={randomConfigure?.maxValue} onChange={(e) => handleRandomConfigChange("maxValue", e.target.value)} />
                  </Form.Item>
                  <Form.Item<RandomConfig> style={{ marginBottom: 10 }}
                    label="最小值"
                    name="minValue"
                  >
                    <Input type="number" placeholder="输入最小值" value={randomConfigure?.minValue} onChange={(e) => handleRandomConfigChange("minValue", e.target.value)} />
                  </Form.Item>
                </Form>
              </Card>
            )}
            {/* 卡片2：仅当 activeKey 为 'card2' 时显示 */}
            {dataActiveKey === 'FIXED' && (
              <Card title="" style={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0 }}>
                <Form
                  ref={fixedConfigForm}
                  name="fixedConfigForm"
                  labelCol={{ span: 8 }}
                  wrapperCol={{ span: 18 }}
                  style={{ maxWidth: 600 }}
                  initialValues={{ remember: true }}
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  autoComplete="off"
                >
                  <Form.Item<FixedConfig> style={{ marginBottom: 10 }}
                    label="取值"
                    name="dataValue"
                  >
                    <Input.TextArea rows={4} placeholder="输入固定值" value={fixedConfigure?.dataValue} onChange={(e) => handleFixedConfigChange("dataValue", e.target.value)} />
                  </Form.Item>

                </Form>
              </Card>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'tab3',
      title: '事件',
      content: (
        <div style={{ height: 400 }}>
          <Form ref={eventConfigForm}
            name="basic"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 18 }}
            style={{ maxWidth: 600 }}
            initialValues={{ remember: true }}
            autoComplete="off"
          >
            <div className="panel">
              <div className="control-group">
                <div className="stroke-row">
                  <Form.Item<EventConfig>
                    label=""
                    name="eventType"
                  >
                    <Select value={eventConfigure?.eventType} onChange={
                      (e) => handleEventConfigChange("eventType", e)
                    } style={{ width: 140 }}>
                      {eventOptions.map(f => (
                        <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>
                <div className="stroke-row">
                  <Form.Item<EventConfig>
                    label=""
                    name="eventValue"
                  >
                    {eventConfigure?.eventType === 'OpenDeviceDetail' && (
                      <Card title="" style={{ height: '100%', padding: 0 }}>
                        <label>设备ID:</label>
                        <Input.TextArea rows={4} style={{ width: 200 }} placeholder=''
                          value={eventConfigure?.eventValue} onChange={(e) => handleEventConfigChange("eventValue", e.target.value)}
                        /></Card>)}
                    {eventConfigure?.eventType === 'OpenCamera' && (
                      <Card title="" style={{ height: '100%', padding: 0 }}>
                        <label>视频地址:</label>
                        <Input.TextArea rows={4} style={{ width: 200 }} placeholder=''
                          value={eventConfigure?.eventValue} onChange={(e) => handleEventConfigChange("eventValue", e.target.value)}
                        />
                      </Card>)}
                    {eventConfigure?.eventType === 'OpenLinkDrawer' && (
                      <Card title="" style={{ height: '100%', padding: 0 }}>
                        <label>连接地址:</label>
                        <Input.TextArea rows={4} style={{ width: 200 }} placeholder=''
                          value={eventConfigure?.eventValue} onChange={(e) => handleEventConfigChange("eventValue", e.target.value)}
                        />
                      </Card>)}
                    {eventConfigure?.eventType === 'OpenLinkBlank' && (
                      <Card title="" style={{ height: '100%', padding: 0 }}>
                        <label>连接地址:</label>
                        <Input.TextArea rows={4} style={{ width: 200 }} placeholder=''
                          value={eventConfigure?.eventValue} onChange={(e) => handleEventConfigChange("eventValue", e.target.value)}
                        />
                      </Card>)}
                  </Form.Item>
                </div>

              </div>
            </div>
            <div style={{ margin: 10 }} /> <br />
          </Form>
        </div>
      )
    }
  ];

  // 切换标签页
  const handleTabClick = (index) => {
    setActiveTab(index);
  };

  useImperativeHandle(parentRef, () => ({
    showResetTip, // 暴露给外部的方法
    cellSelected
  }), []); // 依赖 count，确保方法内获取最新值


  useEffect(() => {
    // 避免无意义的重复设置（核心优化点）
    if (parentRef.current !== currentStoredRef) {
      setDisplayRef(parentRef.current);
    }
  }, [setDisplayRef, parentRef, currentStoredRef]); // 依赖稳定的 setDisplayRef 和当前存储的 ref


  return (
    <div className="app-right">
      <div className="tabs-container">
        <div className="tabs-header">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`tab-button ${index === activeTab ? 'active' : ''}`}
              onClick={() => handleTabClick(index)}
            >
              {tab.title}
            </button>
          ))}
        </div>

        <div className="tabs-content">
          {tabs[activeTab].content}
        </div>
      </div>
    </div>
  );
});

export default TabsExample;
