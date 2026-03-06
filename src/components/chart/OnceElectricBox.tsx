import { Button } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import { VideoCameraOutlined } from '@ant-design/icons';
import { Node } from '@antv/x6';
import watchDefault from '../../assets/onceimg/watch-default.svg'
import drg from '../../assets/onceimg/drg.svg'
import './chart.css';


// 全局弱引用Map：存储X6节点与组件运行时实例的关联（避免内存泄漏+不影响序列化）
const nodeRuntimeMap = new WeakMap<Node, {
  ref: React.RefObject<HTMLDivElement | null>;
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

// configuration passed from parent or stored on node
// defaultValue can include a URL to the json file or direct data
const defaultValue = {
    // remote path to the once.json file; component will fetch this on mount
    url: '/once.json',
    // optional inline data to avoid fetching
    data: null as any | null,
  };

const template = `{
    percent: 30
  }`;

// 封装 ECharts 组件（规范参数解构 + 类型约束）
const OnceElectricBoxComponent: React.FC<ComponentProps> = ({
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
  const instanceIdRef = useRef<string>(`once-${Math.random().toString(36).slice(2,9)}`);

  //判断parentNode 的data是否已经有组件相关的配置，如有相关配置，则使用相关配置，否则使用默认值
  const componentConfig = parentNode.getData().systemComponentConfig || {};
  const initComponentProps = componentConfig.componentProps?.defaultValue || exposeToNode.defaultValue;
  const initTemplate = componentConfig.componentProps?.template || exposeToNode.template;
  const componentSize = componentConfig.componentSize || {};
  const initWidth = componentSize.width || initialWidth;
  const initHeight = componentSize.height || initialHeight;
  const [componentProps, setComponentProps] = useState(initComponentProps);

  const [size, setSize] = useState({
    width: 1900,
    height: 1000,
  });

  const [template, setTemplate] = useState<string>(initTemplate);

  // once diagram data loaded from json or provided directly
  const [onceData, setOnceData] = useState<any | null>(initComponentProps.data || null);

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

  // 5. load once data when componentProps.url or data change
  useEffect(() => {
    const loadOnceData = async () => {
      if (componentProps.data) {
        setOnceData(componentProps.data);
        return;
      }
      if (componentProps.url) {
        try {
          const res = await fetch(componentProps.url);
          const json = await res.json();
          // support either { data: { cabinets: [...] } } or raw
          setOnceData(json.data || json);
        } catch (e) {
          console.error('failed to load once data', e);
        }
      }
    };
    loadOnceData();
  }, [componentProps.url, componentProps.data]);

  // 6. 尺寸变化时自动调整 ECharts 大小 (保留原逻辑，虽然不需要)
  useEffect(() => {
    if (componentRef.current) {
      const chartDom = componentRef.current.querySelector('.ec-echarts');
      if (chartDom && (chartDom as any).resize) {
        (chartDom as any).resize();
      }
    }
  }, [size, componentProps]); // 尺寸变化时执行

  // 7. 调整母线位置：测量各柜顶部连接器位置并设置 .bus-line 的 top
  useEffect(() => {
    const updateBusTop = () => {
      if (!componentRef.current) return;
      const containerEl = componentRef.current.querySelector('.once-container') as HTMLElement | null;
      const busEl = componentRef.current.querySelector('.bus-line') as HTMLElement | null;
      if (!containerEl || !busEl) return;
      const containerRect = containerEl.getBoundingClientRect();
      // horizontal bus top: only follow cabinet names, ignore any device images
      const cabinetEls = containerEl.querySelectorAll('.once-cabinet');
      let maxNameBottom = 0;
      cabinetEls.forEach((cabEl) => {
        const nameEl = cabEl.querySelector('.cabinet-name') as HTMLElement | null;
        if (nameEl) {
          const r = nameEl.getBoundingClientRect();
          const bottom = r.top - containerRect.top + r.height;
          if (bottom > maxNameBottom) maxNameBottom = bottom;
        }
      });
      // put bus a few pixels below the tallest name row
      const top = maxNameBottom > 0 ? maxNameBottom + 6 : 60; // 6px padding; default fallback
      busEl.style.top = `${top}px`;

      // vertical bus per cabinet: start from the horizontal bus and extend down to cover cabinet loops
      const busTopPx = top; // top relative to container
      cabinetEls.forEach((cabEl) => {
        const wrapper = cabEl.querySelector('.cabinet-loops-wrapper') as HTMLElement | null;
        const vbus = cabEl.querySelector('.cabinet-vertical-bus') as HTMLElement | null;
        const loops = cabEl.querySelector('.cabinet-loops') as HTMLElement | null;
        if (wrapper && vbus && loops) {
          const wrapperRect = wrapper.getBoundingClientRect();
          const loopsRect = loops.getBoundingClientRect();
          const wrapperTopRel = wrapperRect.top - containerRect.top;
          const loopsBottomRel = loopsRect.top - containerRect.top + loopsRect.height;
          // vbus top relative to wrapper: busTopPx - wrapperTopRel
          // allow negative top so the vertical bus can extend above the wrapper
          const vTop = busTopPx - wrapperTopRel;
          const vHeight = Math.max(0, loopsBottomRel - busTopPx);
          vbus.style.top = `${vTop}px`;
          vbus.style.height = `${vHeight}px`;
        }
      });
    };

    // wait a frame to ensure layout is stable
    requestAnimationFrame(updateBusTop);
    // also update on window resize
    window.addEventListener('resize', updateBusTop);
    return () => window.removeEventListener('resize', updateBusTop);
  }, [onceData, size]);

  // 8. 将 size 注入到一个 scoped <style>，避免 inline style lint 报错
  useEffect(() => {
    const id = `once-style-${instanceIdRef.current}`;
    let styleEl = document.getElementById(id) as HTMLStyleElement | null;
    const selector = `.once-root[data-instance="${instanceIdRef.current}"] .once-container`;
    const cssText = `${selector} { width: ${size.width}px; height: ${size.height}px; }`;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = id;
      styleEl.type = 'text/css';
      styleEl.appendChild(document.createTextNode(cssText));
      document.head.appendChild(styleEl);
    } else {
      styleEl.textContent = cssText;
    }
    return () => {
      // keep style until unmount; remove on unmount
      // but don't remove here to avoid flicker when size changes frequently
    };
  }, [size]);

  // 6. 渲染（核心：div 样式绑定 size 状态）
  const renderCabinet = (cab: any, index: number) => {
    const imgUrl = cab.imgUrl || cab.redUrl || cab.greenUrl || '';
    const hasWatches = Array.isArray(cab.watches) && cab.watches.length > 0;
    const isHighPressure = cab.type === 'HIGH_PRESSURE_CABINET';
    // prepare metric source: prefer first watch under `watches`, fall back to cabinet-level data
    const getFontVal = (name: string) => {
      if (!Array.isArray(cab.fonts)) return null;
      const f = cab.fonts.find((p: any) => (p.pointName || '').toLowerCase() === name.toLowerCase());
      return f ? f.val : null;
    };
    const cabinetIa = cab.param_s_ia || cab.ia || getFontVal('ia');
    const cabinetIb = cab.param_s_ib || cab.ib || getFontVal('ib');
    const cabinetIc = cab.param_s_ic || cab.ic || getFontVal('ic');
    const firstWatch = hasWatches ? cab.watches[0] : null;
    const metricsSource: any = firstWatch || {
      ia: cabinetIa,
      ib: cabinetIb,
      ic: cabinetIc,
      ua: getFontVal('ua') || cab.ua,
      ub: getFontVal('ub') || cab.ub,
      uc: getFontVal('uc') || cab.uc,
      psum: cab.param_s_psum || cab.psum || getFontVal('psum'),
      ep: cab.ep || getFontVal('ep'),
      pf: cab.pf || getFontVal('pf'),
      f: cab.f || getFontVal('f'),
      t1: (firstWatch && firstWatch.t1) || (cab.transformerTemp && cab.transformerTemp[0] && cab.transformerTemp[0].val) || null,
      t2: (firstWatch && firstWatch.t2) || (cab.transformerTemp && cab.transformerTemp[1] && cab.transformerTemp[1].val) || null,
      t3: (firstWatch && firstWatch.t3) || (cab.transformerTemp && cab.transformerTemp[2] && cab.transformerTemp[2].val) || null,
    };

    return (
      <div key={index} className="once-cabinet">
        <div className="cabinet-name">{cab.name}</div>

        {isHighPressure ? (
          // For high pressure cabinets show the watches (or a default watch image when none)
          <div className="cabinet-loops-wrapper">
            <div className="cabinet-vertical-bus" />
            <div className="cabinet-loops">
              {hasWatches ? (
                cab.watches.map((loop: any, idx: number) => (
                  <div key={idx} className="cabinet-loop">
                    <div className="loop-img-wrapper">
                      <img src={loop.imgUrl || watchDefault} alt={loop.name} title={loop.name} className="loop-img" />
                      <div className="loop-name">{loop.name}</div>
                    </div>
                    <div className="loop-metrics">
                      <div>Ia: {loop.ia != null ? loop.ia : '-'}</div>
                      <div>Ib: {loop.ib != null ? loop.ib : '-'}</div>
                      <div>Ic: {loop.ic != null ? loop.ic : '-'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="cabinet-loop">
                  <div className="loop-img-wrapper">
                    <img src={watchDefault} alt="default-watch" className="loop-img" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // For other cabinet types show the device image (if any), the cabinet image,
          // and render cabinet-level metrics underneath the images.
          <>
            {cab.imgDeviceUrl && (
              <img
                src={cab.imgDeviceUrl}
                alt={`${cab.name}-device`}
                className="cabinet-device-img"

              />
            )}
            {imgUrl && (
              <img
                src={imgUrl}
                alt={cab.name}
                className="cabinet-img"

              />
            )}
            <div className="cabinet-metrics">
              <div>Ua: {metricsSource.ua != null ? metricsSource.ua : '-'}</div>
              <div>Ub: {metricsSource.ub != null ? metricsSource.ub : '-'}</div>
              <div>Uc: {metricsSource.uc != null ? metricsSource.uc : '-'}</div>
              <div>Ia: {metricsSource.ia != null ? metricsSource.ia : '-'}</div>
              <div>Ib: {metricsSource.ib != null ? metricsSource.ib : '-'}</div>
              <div>Ic: {metricsSource.ic != null ? metricsSource.ic : '-'}</div>
              <div>P: {metricsSource.psum != null ? metricsSource.psum : '-'}</div>
              <div>E: {metricsSource.ep != null ? metricsSource.ep : '-'}</div>
              <div>PF: {metricsSource.pf != null ? metricsSource.pf : '-'}</div>
              <div>F: {metricsSource.f != null ? metricsSource.f : '-'}</div>
              <div>T1: {metricsSource.t1 != null ? metricsSource.t1 : '-'}</div>
              <div>T2: {metricsSource.t2 != null ? metricsSource.t2 : '-'}</div>
              <div>T3: {metricsSource.t3 != null ? metricsSource.t3 : '-'}</div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div ref={componentRef} className="once-root" data-instance={instanceIdRef.current}>
      <div className="once-container">
        <div className="bus-line" />
        {onceData && onceData.cabinets
          ? onceData.cabinets.map(renderCabinet)
          : <div className="once-placeholder">无数据</div>}
      </div>
    </div>
  );
};

// 对外暴露：通过X6节点获取组件运行时实例（供外部调用）
export const getOnceElectricBoxComponentRuntime = (node: Node) => {
  return nodeRuntimeMap.get(node);
};
export default OnceElectricBoxComponent;