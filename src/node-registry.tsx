import { Graph, Shape, Node } from '@antv/x6';
import { register } from '@antv/x6-react-shape'

import BarChart from './components/chart/BarChart.tsx';
import SwitchComponent from './components/chart/Switch.tsx';
import ButtonComponent from './components/chart/Button.tsx';
import IFrameComponent from './components/chart/IFrame.tsx';
import VideoComponent from './components/chart/Video.tsx';
import OnceElectricBoxComponent from './components/chart/OnceElectricBox.tsx';
import LineChart from './components/chart/LineChart.tsx';
import ScatterChart from './components/chart/ScatterChart.tsx';
import PieChart from './components/chart/PieChart.tsx';
import TableComponent from './components/chart/Table.tsx';
import Percent from './components/chart/Percent.tsx';
import EnergyFLowComponent from './components/chart/EnergyFLow.tsx';

const iconSize = 30;

// 注册系统组件节点
register({
    shape: 'system-component-bar',
    width: 100,
    height: 100,
    component: ({ node }) => {
        return <BarChart initialWidth={300} initialHeight={300} containerNode={node} />;
    }
})

register({
    shape: 'system-component-line',
    width: 100,
    height: 100,
    component: ({ node }) => {
        return <LineChart initialWidth={300} initialHeight={300} containerNode={node} />;
    }
})

register({
    shape: 'system-component-pie',
    width: 100,
    height: 100,
    component: ({ node }) => {
        return <PieChart initialWidth={300} initialHeight={300} containerNode={node} />;
    }
})

register({
    shape: 'system-component-scatter',
    width: 100,
    height: 100,
    component: ({ node }) => {
        return <ScatterChart initialWidth={300} initialHeight={300} containerNode={node} />;
    }
})

register({
    shape: 'system-component-percent',
    width: 100,
    height: 100,
    component: ({ node }) => {
        return <Percent initialWidth={60} initialHeight={60} containerNode={node} />;
    },
})

register({
    shape: 'system-component-table',
    width: 100,
    height: 100,
    component: ({ node }) => {
        return <TableComponent initialWidth={300} initialHeight={300} containerNode={node} />;
    }
})

register({
    shape: 'system-component-button',
    width: 100,
    height: 50,
    component: ({ node }) => {
        return <ButtonComponent initialWidth={100} initialHeight={50} containerNode={node} />;
    }
})

register({
    shape: 'system-component-switch',
    width: 100,
    height: 50,
    component: ({ node }) => {
        return <SwitchComponent initialWidth={100} initialHeight={50} containerNode={node} />;
    }
})

register({
    shape: 'system-component-iframe',
    width: 300,
    height: 300,
    component: ({ node }) => {
        return <IFrameComponent initialWidth={300} initialHeight={300} containerNode={node} />;
    }
})

register({
    shape: 'system-component-video',
    width: 50,
    height: 50,
    component: ({ node }) => {
        return <VideoComponent initialWidth={50} initialHeight={50} containerNode={node} />;
    }
})

register({
    shape: 'system-component-once-electric-box',
    width: 50,
    height: 50,
    component: ({ node }) => {
        return <OnceElectricBoxComponent initialWidth={50} initialHeight={50} containerNode={node} />;
    }
})
register({
    shape: 'system-component-energy-flow',
    width: 50,
    height: 50,
    component: ({ node }) => {
        return <EnergyFLowComponent initialWidth={50} initialHeight={50} containerNode={node} />;
    }
})
// 定义SVG嵌入节点
Node.define({
    shape: 'svg-embed-node',
    width: 100,
    height: 100,
    attrs: {
        body: {
            fill: 'none',
            stroke: 'none',
        },
        svgImage: {
            x: 0,
            y: 0,
            'xlink:href': '',
        },
    },
    markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'image', selector: 'svgImage' },
    ],
});

// 注册箭头边
Graph.registerEdge(
    'arrow',
    {
        markup: [
            {
                tagName: 'path',
                selector: 'wrap',
                attrs: {
                    fill: 'none',
                    cursor: 'pointer',
                    stroke: 'transparent',
                },
            },
            {
                tagName: 'path',
                selector: 'line',
                attrs: {
                    fill: 'none',
                    'pointer-events': 'none',
                },
            },
            {
                tagName: 'path',
                groupSelector: 'arrow',
                selector: 'arrow1',
            },
            {
                tagName: 'path',
                groupSelector: 'arrow',
                selector: 'arrow2',
            },
            {
                tagName: 'path',
                groupSelector: 'arrow',
                selector: 'arrow3',
            },
        ],
        attrs: {
            wrap: {
                connection: true,
                strokeWidth: 10,
                strokeLinejoin: 'round',
            },
            line: {
                connection: true,
                stroke: '#333333',
                strokeWidth: 2,
                strokeLinejoin: 'round',
                targetMarker: 'classic',
            },
            arrow: {
                d: 'M 0 -10 10 0 0 10 z',
                fill: '#ffffff',
                stroke: '#333333',
                pointerEvents: 'none',
            },
            arrow1: {
                atConnectionRatio: 0.25,
            },
            arrow2: {
                atConnectionRatio: 0.5,
            },
            arrow3: {
                atConnectionRatio: 0.75,
            },
        },
    },
    true,
)

// 注册自定义节点
Graph.registerNode(
    'static-text-icon',
    {
        inherit: 'image',
        width: iconSize,
        height: iconSize,
        attrs: {
            body: {
                strokeWidth: 1,
                stroke: 'none',
                fill: 'none',
            },
            text: {
                fontSize: 12,
                fill: '#262626',
            },
        },
        data: {
            realShapeName: 'static-text-graph'
        },
    },
    true,
);

// 注册自定义节点
Graph.registerNode(
    'custom-rect-icon',
    {
        inherit: 'image',
        width: iconSize,
        height: iconSize,
        attrs: {
            body: {
                strokeWidth: 1,
                stroke: '#030303ff',
                fill: 'none',
            },
            text: {
                fontSize: 12,
                fill: '#262626',
            },
        },
        data: {
            realShapeName: 'rect'
        },
    },
    true,
);

// 注册自定义节点
Graph.registerNode(
    'custom-line-icon',
    {
        inherit: 'image',
        width: iconSize,
        height: iconSize,
        attrs: {
            body: {
                strokeWidth: 2,
                stroke: '#5F95FF',
                fill: '#EFF4FF',
            },
            text: {
                fontSize: 12,
                fill: '#262626',
            },
        },
        data: {
            realShapeName: 'custom-line'
        },
    },
    true,
);


Graph.registerNode(
    'custom-circle-icon',
    {
        inherit: 'image',
        width: iconSize,
        height: iconSize,
        attrs: {
            body: {
                strokeWidth: 2,
                stroke: '#0b0b0bff',
                fill: 'none',
            },
            text: {
                fontSize: 12,
                fill: '#262626',
            },
        },
        data: {
            realShapeName: 'circle'
        },
    },
    true,
);

Graph.registerNode(
    'customImage',
    {
        inherit: 'rect',
        width: iconSize,
        height: iconSize,
        markup: [
            { tagName: 'rect', selector: 'body' },
            { tagName: 'image' },
            { tagName: 'text', selector: 'label' },
        ],
        attrs: {
            body: {
                // stroke: '#090a0aff',
                // fill: '#0d0d0eff',
            },
            image: {
                width: 50,
                height: 50,
                refX: 0,
                refY: 0,
            },

        },
    },
    true,
);

Graph.registerNode(
    'svgImage',
    {
        inherit: 'rect',
        width: iconSize,
        height: iconSize,
        markup: [
            { tagName: 'rect', selector: 'body' },
            { tagName: 'image' },
            { tagName: 'text', selector: 'label' },
        ],
        attrs: {
            body: {
                stroke: '#5F95FF',
                fill: '#cfd6e5ff',
            },
            image: {
                width: 50,
                height: 50,
                refX: 0,
                refY: 0,
            },
        },
    },
    true,
);

Graph.registerNode(
    'systemComponent',
    {
        inherit: 'image',
        width: iconSize,
        height: iconSize,
        attrs: {
            image: {
                width: iconSize,
                height: iconSize,
                refX: 0,
                refY: 0,
            },
        },
    },
    true,
);


Graph.registerNode(
    'customSvg',
    {
        inherit: 'rect',
        width: iconSize,
        height: iconSize,
        markup: [
            { tagName: 'rect', selector: 'body' },
            { tagName: 'image' },
            { tagName: 'text', selector: 'label' },
        ],
        attrs: {
            body: {
                // stroke: '#5F95FF',
                // fill: '#5F95FF',
            },
            image: {
                width: iconSize,
                height: iconSize,
                refX: 0,
                refY: 0,
            },

        },
    },
    true,
);

Graph.registerEdgeTool('circle-target-arrowhead', {
    inherit: 'target-arrowhead',
    tagName: 'circle',
    attrs: {
        r: 5,
        fill: '#31d0c6',
        'fill-opacity': 0.3,
        stroke: '#fe854f',
        'stroke-width': 0,
        cursor: 'move',
    },
});

Graph.registerEdgeTool('circle-source-arrowhead', {
    inherit: 'source-arrowhead',
    tagName: 'circle',
    attrs: {
        r: 5,
        fill: '#31d0c6',
        'fill-opacity': 0.3,
        stroke: '#fe854f',
        'stroke-width': 0,
        cursor: 'move',
    },
});

// 注册静态文本节点
Shape.HTML.register({
    shape: 'static-text-graph',
    width: 66,
    height: 36,
    effect: ['data'],
    html(node: Node) {
        const div = document.createElement('div');
        div.className = 'static-text';
        div.id = node.id + 'container';

        // 获取节点数据中的文本，默认为"静态文本"
        const textConfig = node.getData()?.textStyle;
        const textStates = node.getData()?.defaultStyle;
        let text = '静态文本';
        if (textConfig) {
            text = textConfig.html;
        }
        let style = 'font-family: sans-serif; font-size:16pt;   font-size:16pt; font-weight:bold; font-style:italic; color:#240D00;'
        if (textStates) {
            style = "font-family: " + textStates.font + "; font-size: " + textStates.size + "pt;font-weight: " + (textStates.isBold ? "bold" : "normal") + ";font-style: " + (textStates.isItalic ? "italic" : "normal") + ";text-decoration: " + (textStates.isUnderline ? "underline" : "none") + ";color: " + textStates.color;
        }
        // 创建文本显示元素
        const textElement = document.createElement('div');
        textElement.className = 'text-content';
        textElement.textContent = text;

        // 添加到容器
        div.appendChild(textElement);
        div.style.cssText = style;
        return div;
    },
});
