import React, { useState, useEffect, useRef } from 'react';
import { Node } from '@antv/x6';
import {Table } from 'antd'
import './chart.css'

// 全局弱引用Map：存储X6节点与组件运行时实例的关联（避免内存泄漏+不影响序列化）
const nodeRuntimeMap = new WeakMap<Node, {
  ref: React.RefObject<HTMLDivElement>;
  setComponentSize: (width: number, height: number) => void;
  getComponentSize: () => { width: number, height: number };
  setExposeToNodeProps: (props: any) => void;
  getExposeToNodeProps: () => any;
}>();

interface ChartProps {
  containerNode: Node;
  initialWidth?: number;
  initialHeight?: number;
  exposeToNode?: any;
}

const defaultValue = {
  "dataSource": [{
    key: '1',
    name: '胡彦斌',
    age: 32,
    address: '西湖区湖底公园1号',
  },
  {
    key: '2',
    name: '胡彦祖',
    age: 42,
    address: '西湖区湖底公园1号',
  },], "columns": [{
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '年龄',
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: '住址',
    dataIndex: 'address',
    key: 'address',
  },]
}
const template = `{
    "dataSource": [{
      key: '1',
      name: '胡彦斌',
      age: 32,
      address: '西湖区湖底公园1号',
    },
    {
      key: '2',
      name: '胡彦祖',
      age: 42,
      address: '西湖区湖底公园1号',
    },], "columns": [{
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: '住址',
      dataIndex: 'address',
      key: 'address',
    },]
  }`

// 封装 ECharts 组件（规范参数解构 + 类型约束）
const TableComponent: React.FC<ChartProps> = ({
  initialWidth = 300, // 合理默认值
  initialHeight = 300,
  containerNode,
  exposeToNode = {
    defaultValue: defaultValue,
    template: template
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
        componentProps: { defaultValue: chartOption, template: exposeToNode.template }
      }
    });
  };


  // 1. 初始化图表配置项（融合传入的 Props）
  const [chartOption, setChartOption] = useState(initChartOption);
  const [template, setTemplate] = useState<string>(initTemplate);
  
  const [dataSource, setDataSource] = useState(defaultValue.dataSource)
  const [columns, setColumns] = useState(defaultValue.columns)
  const setExposeToNodeProps = (props: any) => {
    if (props.defaultValue) {
      setChartOption(props.defaultValue)
      setDataSource(props.defaultValue.dataSource)
      setColumns(props.defaultValue.columns)
    }
    if (props.template) {
      setTemplate(props.template)
    }

  }
  const getExposeToNodeProps = () => {
    return { defaultValue: chartOption, template: template };
  }

  // 暴露给父组件的尺寸设置方法
  const setComponentSize = (width: number, height: number) => {
    if (width < 0 || height < 0) return; // 参数校验
    setSize({ width, height }); 
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
      }}
    >
      {/* 使用 echarts-for-react 组件 */}
      <Table columns={columns} pagination={false} dataSource={dataSource} />
    </div>
  );
};

// 对外暴露：通过X6节点获取组件运行时实例（供外部调用）
export const getTableComponentRuntime = (node: Node) => {
  return nodeRuntimeMap.get(node);
};
export default TableComponent;