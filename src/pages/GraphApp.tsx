import React, { useRef, useEffect, useState } from 'react';
import LeftBar from '../components/leftBar/LeftBar';
import Settings from '../components/Settings';
import '../main.css';
import TopMenu from '../components/TopMenu';
import MainCanvas from '../components/MainCanvas';
import { Graph, Shape } from '@antv/x6';
import { CounterProvider } from '../graph-context';
import { Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

const MainGraphApp: React.FC = () => {
  const graphRef = useRef<Graph | null>(null);
  const [graphReady, setGraphReady] = useState(false);
  const displayRef = useRef(null);
  const [leftBarCollapsed, setLeftBarCollapsed] = useState(false);
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);

  // 切换左侧栏展开/收缩
  const toggleLeftBar = () => {
    setLeftBarCollapsed(!leftBarCollapsed);
  };

  // 切换设置面板展开/收缩
  const toggleSettings = () => {
    setSettingsCollapsed(!settingsCollapsed);
  };


  useEffect(() => {
    const graph = new Graph({
      container: document.getElementById('graphCanvasContainer')!,
      grid: false,
      // panning: { enabled: false, eventTypes: ['leftMouseDown', 'mouseWheel'] },
      panning: { enabled: true, modifiers: 'shift' },
      mousewheel: {
        enabled: false,
        zoomAtMousePosition: false,
        modifiers: 'ctrl',
        minScale: 0.5,
        maxScale: 3,
      },
      interacting: {  // 交互配置（确保画布可聚焦）
        edgeMovable: true,   // 允许移动线条
        vertexMovable: true,  // 允许移动端点
        vertexAddable: true,
        vertexDeletable: true,
      },
      connecting: {
        enabled: true,
        reconnection: true,
        router: 'normal',
        connector: { name: 'rounded', args: { radius: 8 } },
        anchor: 'center',
        connectionPoint: 'anchor',
        allowBlank: true,
        snap: { radius: 20 },
        createEdge() {
          return new Shape.Edge({
            // vertices: [
            //   { x: 90, y: 160 },
            //   { x: 210, y: 160 },
            // ],
            tools: [
              {
                name: 'vertices', // 工具名称
                args: {
                  attrs: { r: 1, fill: 'none', stroke: 'none'},
                },
              },
            ],
            route: 'normal',
            selectable: true,
            attrs: {
              line: {
                stroke: '#030303ff',
                strokeWidth: 1,
                // targetMarker: { name: 'block', width: 12, height: 8 },
                // targetMarker: {
                //   tagName: 'path',
                //   attrs: {
                //     d: 'M 0 0 L 10 5 L 0 10 z',
                //     fill: '#030303ff',
                //   },
                // },

              },
              // 自定义顶点（vertices）工具的样式
              '.x6-edge-vertex': {
                r: 8, // 顶点控制点的半径（默认 6）
                fill: '#40a9ff', // 填充色
                stroke: '#1890ff', // 边框色
                strokeWidth: 2, // 边框宽度
                // 鼠标悬停时的样式（可选）
                '&:hover': {
                  fill: '#1890ff',
                  stroke: '#096dd9',
                },
              },
              // 自定义顶点拖拽时的幽灵点样式（可选）
              '.x6-edge-vertex-ghost': {
                r: 10, // 幽灵点半径
                fill: 'rgba(24, 144, 255, 0.2)', // 半透明填充
                stroke: 'rgba(24, 144, 255, 0.5)', // 半透明边框
              },
            },

            zIndex: 0,
          });
        },
        validateConnection({ targetMagnet }) {
          return !!targetMagnet;
        },
      },
      tools: {
        'circle-source-arrowhead': true, // 启用自定义源端点
        'circle-target-arrowhead': true, // 启用自定义目标端点
        vertices: true, // 启用顶点拖拽工具（可选）
      },
      highlighting: {
        magnetAdsorbed: {
          name: 'stroke',
          args: { attrs: { fill: '#5F95FF', stroke: '#5F95FF' } },
        },
      },
    });
    graphRef.current = graph;
    setGraphReady(true);

    return () => {
      graph.dispose();
      graphRef.current = null;
      setGraphReady(false);
    };
  }, []);

  return (
    <div className="web-scada-app">
      <CounterProvider>
        <TopMenu graph={graphRef.current} />
        <div className="web-scada-body">
          {/* 左侧栏 */}
          <div className={`leftbar-container ${leftBarCollapsed ? 'collapsed' : ''}`}>
            <LeftBar graph={graphRef.current} />
            <Button
              type="text"
              icon={leftBarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleLeftBar}
              className="collapse-btn leftbar-collapse-btn"
              size="small"
            />
          </div>

          {/* 主内容区域 */}
          <div
            className={`main-content ${leftBarCollapsed ? 'left-collapsed' : ''} ${settingsCollapsed ? 'right-collapsed' : ''}`}
            style={{
              height: '100%',   // 可视区域高度
              overflow: 'auto',  // 超过尺寸时显示滚动条
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }}
          >
            <MainCanvas graph={graphRef.current} />
          </div>

          {/* 设置面板 */}
          <div className={`settings-container ${settingsCollapsed ? 'collapsed' : ''}`}>
            <Button
              type="text"
              icon={settingsCollapsed ? <MenuUnfoldOutlined style={{ transform: 'rotate(180deg)' }} /> : <MenuFoldOutlined style={{ transform: 'rotate(180deg)' }} />}
              onClick={toggleSettings}
              className="collapse-btn settings-collapse-btn"
              size="small"
            />
            <Settings graph={graphRef.current} ref={displayRef} />
          </div>
        </div>
      </CounterProvider>
    </div>
  );
};

export default MainGraphApp;
