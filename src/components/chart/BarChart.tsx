import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { Node } from '@antv/x6';
import type { EChartsOption } from 'echarts';


// 全局弱引用Map：存储X6节点与组件运行时实例的关联（避免内存泄漏+不影响序列化）
const nodeRuntimeMap = new WeakMap<Node, {
  ref: React.RefObject<HTMLDivElement>;
  setComponentSize: (width: number, height: number) => void;
  getComponentSize: () => { width: number, height: number };
  setExposeToNodeProps: (props: ExposeToNodeProps) => void;
  getExposeToNodeProps: () => ExposeToNodeProps;
}>();

interface ChartProps {
  containerNode: Node;
  initialWidth?: number;
  initialHeight?: number;
  exposeToNode?: any;
}

const defaultCharOption = {
    title: {
      text: 'bar 使用示例',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      // type: xAxisField.type,
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    yAxis: {
      // type: yAxisField.type,
    },
    series: [
      {
        name: '访问量',
        type: 'bar',
        data: [120, 200, 150, 80, 70, 110, 130],
        itemStyle: {
          color: '#1890ff',
        },
      },
    ],
  }
const chartOptionTemplate = `{
  "title": {
    "text": "bar 使用示例",
    "left": "center"
  },
  "tooltip": {
    "trigger": "axis"
  },
  "xAxis": {
    "type": "category",
    "data": \${data.map(item => item.time.split('T')[1])}
  },
  "yAxis": {
    "type": "value"
  },
  "series": [
    {
      "name": "电流(A)",
      "data": \${data.map(item => item.current)},
      "type": "bar",
      "label": {
        "show": true,
        "position": "bottom"
      }
    },
    {
      "name": "相位(°)",
      "data": \${data.map(item => item.phase)},
      "type": "bar",
      "label": {
        "show": true,
        "position": "bottom"
      }
    },
    {
      "name": "电压(V)",
      "data": \${data.map(item => item.voltage)},
      "type": "bar",
      "label": {
        "show": true,
        "position": "bottom"
      }
    }
  ]
}`

// 封装 ECharts 组件（规范参数解构 + 类型约束）
const BarChart: React.FC<ChartProps> = ({
  initialWidth = 300, // 合理默认值
  initialHeight = 300,
  containerNode,
  exposeToNode = {
   defaultValue: defaultCharOption,
   template: chartOptionTemplate
  }
}) => {
  const parentNode = containerNode;
  const componentRef = useRef<HTMLDivElement>(null);

  //判断parentNode 的data是否已经有组件相关的配置，如有相关配置，则使用相关配置，否则使用默认值
  const componentConfig = parentNode.getData().systemComponentConfig || {};
  const initChartOption = componentConfig.componentProps?.defaultValue || exposeToNode.defaultValue;
  const initTemplate = componentConfig.componentProps?.template || exposeToNode.template;
  const componentSize = componentConfig.componentSize || {};
  const initWidth = componentSize.width || initialWidth;
  const initHeight = componentSize.height || initialHeight;

  const [size, setSize] = useState({
    width: initWidth,
    height: initHeight,
  });

  // 同步组件配置到X6节点data（仅存储可序列化数据）
  const syncComponentConfigToNode = () => {
    const currentConfig = parentNode.getData().systemComponentConfig || {};
    parentNode.setData({
      ...parentNode.getData(),
      systemComponentConfig: {
        ...currentConfig,
        componentSize: size,
        componentProps: {defaultValue: chartOption, template: exposeToNode.template}
      }
    });
  };


  // 1. 初始化图表配置项（融合传入的 Props）
  const [chartOption, setChartOption] = useState<EChartsOption>(initChartOption);
  const [template, setTemplate] = useState<string>(initTemplate);
  const setExposeToNodeProps = (props: any) => {
    if(props.defaultValue){
      setChartOption(props.defaultValue)
    }
    if(props.template){
      setTemplate(props.template)
    }
    
  }
  const getExposeToNodeProps = () => {
    return {defaultValue: chartOption, template: template};
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

  // 5. 尺寸变化时自动调整 ECharts 大小
  useEffect(() => {
    if (componentRef.current) {
      // 获取 ECharts 实例并触发 resize
      const chartDom = componentRef.current.querySelector('.ec-echarts');
      if (chartDom && (chartDom as any).resize) {
        (chartDom as any).resize();
      }
    }
  }, [size, chartOption]); // 尺寸变化时执行

  // 6. 渲染（核心：div 样式绑定 size 状态）
  return (
    <div
      ref={componentRef}
      style={{
        width: `${size.width}px`, // 绑定宽度，由 setComponentSize 控制
        height: `${size.height}px`, // 绑定高度，由 setComponentSize 控制
        margin: '20px auto', // 保留原有外边距
      }}
    >
      <ReactECharts
        option={chartOption}
        opts={{
          renderer: 'canvas', // 渲染模式
          devicePixelRatio: window.devicePixelRatio,
        }}
        // ECharts 容器占满外层 div
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

// 对外暴露：通过X6节点获取组件运行时实例（供外部调用）
export const getBarChartComponentRuntime = (node: Node) => {
  return nodeRuntimeMap.get(node);
};
export default BarChart;