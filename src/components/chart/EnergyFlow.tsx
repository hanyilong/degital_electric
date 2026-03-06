import { Button } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import { VideoCameraOutlined } from '@ant-design/icons';
import { Node } from '@antv/x6';
import './chart.css';


// 全局弱引用Map：存储X6节点与组件运行时实例的关联（避免内存泄漏+不影响序列化）
const nodeRuntimeMap = new WeakMap<Node, {
  ref: React.RefObject<HTMLDivElement>;
  setComponentSize: (width: number, height: number) => void;
  getComponentSize: () => { width: number, height: number };
  setExposeToNodeProps: (props: any) => void;
  getExposeToNodeProps: () => any;
}>();



// 定义完整的 Props 类型
interface ComponentProps {
  // apiConfig?: ApiConfigure; // 可选属性，根据实际使用场景调整
  // percentField?: string;     // 可选属性
  initialWidth?: number;     // 初始宽度
  initialHeight?: number;    // 初始高度
  containerNode: Node;
  exposeToNode?: any;
}

const defaultValue = {
    type: 'primary',
    color: 'red',
    shape: 'circle',
    styles: {
      root: {
        backgroundColor: '#171717',
      },
      content: {
        color: '#fff',
      },
    }
  }
const template = `{
    percent: 30
  }`

// 封装 ECharts 组件（规范参数解构 + 类型约束）
const EnergyFLowComponent: React.FC<ComponentProps> = ({
  initialWidth = 80, // 默认值
  initialHeight = 80, // 默认值
  containerNode = new Node({}),
  exposeToNode = {   
    defaultValue: defaultValue,
    template: template
  }
}) => {
  const parentNode = containerNode;
  const componentRef = useRef<HTMLDivElement>(null);

  //判断parentNode 的data是否已经有组件相关的配置，如有相关配置，则使用相关配置，否则使用默认值
  const componentConfig = parentNode.getData().systemComponentConfig || {};
  const initComponentProps = componentConfig.componentProps?.defaultValue || exposeToNode.defaultValue;
  const initTemplate = componentConfig.componentProps?.template || exposeToNode.template;
  const componentSize = componentConfig.componentSize || {};
  const initWidth = componentSize.width || initialWidth;
  const initHeight = componentSize.height || initialHeight;
  const [componentProps, setComponentProps] = useState(initComponentProps);

  const [size, setSize] = useState({
    width: 1000,
    height: 800,
  });

  const [template, setTemplate] = useState<string>(initTemplate);

  // 同步组件配置到X6节点data（仅存储可序列化数据）
  const syncComponentConfigToNode = () => {
    const currentConfig = parentNode.getData().systemComponentConfig || {};
    parentNode.setData({
      ...parentNode.getData(),
      systemComponentConfig: {
        ...currentConfig,
        componentSize: size,
        componentProps: {defaultValue: componentProps, template: template}
      }
    });
  };


  // 1. 初始化图表配置项（融合传入的 Props）
  const setExposeToNodeProps = (props: any) => {
    if(props.defaultValue){
      setComponentProps(props.defaultValue)
    }
    if(props.template){
      setTemplate(props.template)
    }
    
  }
  const getExposeToNodeProps = () => {
    return {defaultValue: componentProps, template: template};
  }

  // 暴露给父组件的尺寸设置方法
  const setComponentSize = (width: number, height: number) => {
    if (width < 0 || height < 0) return; // 参数校验
    setSize({ width, height }); // 更新尺寸状态，自动同步到div样式
  };
  const getComponentSize = () => {
    return size;
  }

// 组件挂载时：维护运行时Map，初始化配置
  useEffect(() => {
    // 1. 初始化可序列化配置（避免首次无数据）
    if (!parentNode.getData().componentConfig) {
      syncComponentConfigToNode();
    }

    // 2. 将运行时实例存入全局Map（不存入X6节点data）
    nodeRuntimeMap.set(parentNode, {
      ref: componentRef,
      setComponentSize,
      getComponentSize,
      setExposeToNodeProps,
      getExposeToNodeProps,
    });

    // 卸载时清理Map，避免内存泄漏
    return () => {
      nodeRuntimeMap.delete(parentNode);
    };
  }, [parentNode, initialWidth, initialHeight, exposeToNode]);

  // 5. hierarchical data simulation
  interface LoopInfo {
    name: string;
    value: number;
  }
  interface CabinetInfo {
    name: string;
    value: number;
    loops: LoopInfo[];
  }

  const [flowData, setFlowData] = useState<{
    total: number;
    cabinets: CabinetInfo[];
  }>({
    total: 0,
    cabinets: [],
  });

  // refs for layout measurement
  const totalRef = useRef<HTMLDivElement>(null);
  const cabinetRefs = useRef<Array<HTMLDivElement | null>>([]);
  const loopRefs = useRef<Array<HTMLDivElement | null>>([]);

  // svg path strings
  const [paths, setPaths] = useState<string[]>([]);

  const computePaths = () => {
    const container = componentRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const totalRect = totalRef.current?.getBoundingClientRect();
    if (!totalRect) return;
    const startX = totalRect.right - rect.left;
    const startY = totalRect.top + totalRect.height / 2 - rect.top;
    const newPaths: string[] = [];

    flowData.cabinets.forEach((cab, i) => {
      const cabRect = cabinetRefs.current[i]?.getBoundingClientRect();
      if (!cabRect) return;
      const endX = cabRect.left - rect.left;
      const endY = cabRect.top + cabRect.height / 2 - rect.top;
      const midX = (startX + endX) / 2;
      newPaths.push(`M ${startX} ${startY} C ${midX} ${startY} ${midX} ${endY} ${endX} ${endY}`);

      const startX2 = cabRect.right - rect.left;
      const startY2 = cabRect.top + cabRect.height / 2 - rect.top;
      cab.loops.forEach((loop, j) => {
        const index =
          flowData.cabinets
            .slice(0, i)
            .reduce((sum, c) => sum + c.loops.length, 0) +
          j;
        const loopRect = loopRefs.current[index]?.getBoundingClientRect();
        if (!loopRect) return;
        const endX2 = loopRect.left - rect.left;
        const endY2 = loopRect.top + loopRect.height / 2 - rect.top;
        const midX2 = (startX2 + endX2) / 2;
        newPaths.push(`M ${startX2} ${startY2} C ${midX2} ${startY2} ${midX2} ${endY2} ${endX2} ${endY2}`);
      });
    });

    setPaths(newPaths);
  };

  // recalc when layout or data changes
  useEffect(() => {
    // wait for DOM updates
    const id = setTimeout(computePaths, 0);
    return () => clearTimeout(id);
  }, [flowData, size]);

  useEffect(() => {
    // create some static cabinet/loop names for demonstration
    const cabinetNames = ['Cabinet A', 'Cabinet B', 'Cabinet C'];
    const loopCounts = [3, 2, 4];

    const tick = () => {
      const cabinets: CabinetInfo[] = cabinetNames.map((cn, idx) => {
        const loops: LoopInfo[] = Array.from({ length: loopCounts[idx] }, (_, j) => ({
          name: `Loop ${j + 1}`,
          value: 0,
        }));
        return { name: cn, value: 0, loops };
      });
      // assign random values, propagate totals
      let total = 0;
      cabinets.forEach(cab => {
        cab.loops.forEach(loop => {
          loop.value = +(Math.random() * 200).toFixed(1);
          cab.value += loop.value;
        });
        total += cab.value;
      });
      setFlowData({ total, cabinets });
    };
    tick();
    const hid = setInterval(tick, 1500);
    return () => clearInterval(hid);
  }, []);

  // 6. 尺寸变化时自动调整 ECharts 大小 (not used here but kept)
  useEffect(() => {
    if (componentRef.current) {
      const chartDom = componentRef.current.querySelector('.ec-echarts');
      if (chartDom && (chartDom as any).resize) {
        (chartDom as any).resize();
      }
    }
  }, [size, componentProps]); // 尺寸变化时执行

  // 6. 渲染（核心：div 样式绑定 size 状态）
  return (
    <div ref={componentRef} className="energy-flow-root" style={{ width: size.width, height: size.height }}>
      {/* svg overlay for curves */}
      <svg className="energy-lines">
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>

      {/* left column: total consumption */}
      <div className="energy-column">
        <div ref={totalRef} className="energy-item">
          总能耗
          <div className="energy-value">{flowData.total.toFixed(1)} kW</div>
        </div>
      </div>

      {/* middle column: cabinets */}
      <div className="energy-column">
        {flowData.cabinets.map((cab, idx) => (
          <div
            key={idx}
            ref={el => (cabinetRefs.current[idx] = el)}
            className="energy-item"
          >
            {cab.name}
            <div className="energy-value">{cab.value.toFixed(1)} kW</div>
          </div>
        ))}
      </div>

      {/* right column: loops */}
      <div className="energy-column">
        {flowData.cabinets.map((cab, ci) => (
          <React.Fragment key={ci}>
            {cab.loops.map((loop, li) => {
              const index =
                flowData.cabinets
                  .slice(0, ci)
                  .reduce((sum, c) => sum + c.loops.length, 0) +
                li;
              return (
                <div
                  key={`${ci}-${li}`}
                  ref={el => (loopRefs.current[index] = el)}
                  className="energy-item"
                >
                  {cab.name} / {loop.name}
                  <div className="energy-value">{loop.value.toFixed(1)} kW</div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// 对外暴露：通过X6节点获取组件运行时实例（供外部调用）
export const getEnergyFLowComponentRuntime = (node: Node) => {
  return nodeRuntimeMap.get(node);
};
export default EnergyFLowComponent;