import { Switch } from 'antd';
import React, { useState, useEffect, useRef, type ReactNode } from 'react';
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

interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  size?: 'small' | 'default' | 'large';
  checkedChildren?: ReactNode;
  unCheckedChildren?: ReactNode;
  onChange?: (checked: boolean) => void;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

const defaultValue: SwitchProps = { 
  checked: false,
  defaultChecked: false,
  size: 'default',
  checkedChildren: '开启',
  unCheckedChildren: '关闭',
  onChange: (checked: boolean) => { },
  onClick: (e: React.MouseEvent<HTMLElement>) => { }
}
const template = `{
    percent: 30
}`

// 封装 ECharts 组件（规范参数解构 + 类型约束）
const SwitchComponent: React.FC<ComponentProps> = ({
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
    width: initWidth,
    height: initHeight,
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
        componentProps: { defaultValue: componentProps, template: template }
      }
    });
  };


  // 1. 初始化图表配置项（融合传入的 Props）
  const setExposeToNodeProps = (props: any) => {
    if (props.defaultValue) {
      setComponentProps(props.defaultValue)
    }
    if (props.template) {
      setTemplate(props.template)
    }

  }
  const getExposeToNodeProps = () => {
    return { defaultValue: componentProps, template: template };
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
  }, [size, componentProps]); // 尺寸变化时执行

  // 6. 渲染（核心：div 样式绑定 size 状态）
  return (
    <div ref={componentRef} style={{ width: size.width, height: size.height }}>
      {/* antd 的圆形 Progress 组件，size 接收数字（宽高一致）或 { width, height } */}
      {/* <Progress type="circle" percent={componentProps.percent} size={size.width} /> */}
      <Switch defaultChecked size={componentProps.size} />
    </div>
  );
};

// 对外暴露：通过X6节点获取组件运行时实例（供外部调用）
export const getSwitchComponentRuntime = (node: Node) => {
  return nodeRuntimeMap.get(node);
};
export default SwitchComponent;