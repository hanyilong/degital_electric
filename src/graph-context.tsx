import { createContext, useContext, useReducer, useCallback, useState } from 'react';
import { Graph, Node, Cell} from '@antv/x6';

// 导入节点注册逻辑
import './node-registry';

export type TextStyleConfig = {
    html: string;
}

export type StyleConfigure = {
    //默认大小
    width: number;
    height: number;
    //字体
    font: string;
    color: string;
    size: number;
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
    //rect,circle,ellipse,line
    fillColor: string;
    stroke: string;
    strokeDasharray: string;
    strokeWidth: number;
    rx: number;
    ry: number;
    //动画效果
    valueExp: string;
    selectEnable: boolean;
    animation: boolean;
    connector: string;
    //自定义图片，或者矢量图
    imageUrl: string;
    svgTemplate: string;
}

export type ApiConfigure = {
    apiUrl?: string;
    apiMethod?: string;
    apiBody?: string;
    apiHeaders?: string;
    responseData?: string;
    extractPath?: string;
    extractValue?: string;
}

export type IotConfigure = {
    projectId?: string;
    deviceTypeId?: string;
    deviceId?: string;
    propertyId?: string;
    lastValue?: string;
    lastTime?: string;
}

export type RandomConfig = {
    minValue?: number;
    maxValue?: number;
}

export type FixedConfig = {
    dataValue: any;
}

export type EventConfig = {
    eventType: string;
    eventValue: string;
}

export type systemComponentConfig = {
    componentSize: {
        width: number;
        height: number;
    };
    componentProps: any;
}

export type NodeDataType = {
    //basic
    nodeId: string;
    nodeType: string; // static-text-graph,iot-text-graph,api-text-graph,customImage,custom-circle,custom-rect,customSvg
    dataType: string;  //string, number, boolean
    dataSource: string; // IOT, API, STATIC
    dataValue: any;

    //configure
    fixedConfigure?: FixedConfig;
    randomConfigure?: RandomConfig;
    iotConfigure?: IotConfigure;
    apiConfigure?: ApiConfigure;

    //eventconfig
    eventConfig?: EventConfig;

    //style
    defaultStyle?: StyleConfigure;
    stopStyle?: StyleConfigure;
    startStyle?: StyleConfigure;
    textStyle?: TextStyleConfig;

    // system component 
    systemComponentConfig?: systemComponentConfig;
};


export type BoardConfigure = {
    boardId: string;
    boardName: string;
    bgColor: string;
    bgImage: string;
    boardData: any;
    router: string;
    width: number;
    height: number;
    nodeDataConfigs: NodeDataType[];
}


// 1. 定义初始状态和 action 类型
const initialState = {
    count: 0, // 共享的计数器数据
    displayRef: null, // 存储 Display 组件暴露的方法
};

// 2. 定义 reducer 处理状态更新
function counterReducer(state, action) {
    switch (action.type) {
        case 'INCREMENT':
            return { ...state, count: state.count + 1 };
        case 'DECREMENT':
            return { ...state, count: state.count - 1 };
        case 'RESET':
            return { ...state, count: 0 };
        case 'SET_DISPLAY_REF': // 存储 Display 组件的 ref
            return { ...state, displayRef: action.payload };
        default:
            return state;
    }
}


function getStyleFromCSSText(cssText: string): StyleConfigure {
    const style: StyleConfigure = {
        font: '',
        color: '',
        size: 0,
        isBold: false,
        isItalic: false,
        isUnderline: false,
        fillColor: '',
        stroke: '',
        strokeDasharray: '',
        strokeWidth: 0,
        rx: 0,
        ry: 0,
        valueExp: '',
        selectEnable: false,
        animation: false,
        connector: '',
        imageUrl: '',
        svgTemplate: '',
    }
    if (!cssText) {
        return style;
    }
    const cssTextArray = cssText.split(';');
    cssTextArray.forEach(item => {
        const [key, value] = item.split(':');
        if (key === 'font-family') {
            style.font = value;
        } else if (key === 'font-size') {
            style.size = parseInt(value);
        } else if (key === 'color') {
            style.color = value;
        } else if (key === 'font-weight') {
            style.isBold = value === 'bold';
        } else if (key === 'font-style') {
            style.isItalic = value === 'italic';
        } else if (key === 'text-decoration') {
            style.isUnderline = value === 'underline';
        }
    });
    return style;
}

export function createAndGetCellData(selectedCell: Cell): NodeDataType {
    let nodeDataType = selectedCell.getData();
    if (!nodeDataType) {
        nodeDataType = {
            nodeId: selectedCell.id,
            nodeType: selectedCell.shape,
            dataType: 'string',
            dataSource: 'STATIC',
            dataValue: '',
        }
        selectedCell.setData(nodeDataType);
    }
    return selectedCell.getData()
}

export function getCellStyle(cell: Cell): StyleConfigure {
    let style: StyleConfigure;
    if (cell.getData()) {
        style = cell.getData().defaultStyle;
    } else {
        cell.setData(createAndGetCellData(cell));
    }
    if (!style) {
        if (cell.shape === 'static-text-graph') {
            const containerId = cell?.id + 'container';
            const container = document.getElementById(containerId)!;
            const textElement = container.querySelector('.text-content');
            style = getStyleFromCSSText(textElement?.style.cssText);
        } else if (cell.shape !== 'image') {
            console.log('node attrs', cell.attrs);
            if (cell.attrs?.text) {
                style = {
                    font: String(cell.attrs?.text?.fontFamily || '微软雅黑'),
                    size: Number(cell.attrs?.text?.fontSize || 12),
                    color: String(cell.attrs?.text?.fill || '#000000'),
                    isBold: cell.attrs?.text?.fontWeight === 'bold' || false,
                    isItalic: cell.attrs?.text?.fontStyle === 'italic' || false,
                    isUnderline: cell.attrs?.text?.textDecoration === 'underline' || false,
                    fillColor: String(cell.attrs?.body?.fill || '#ffffff'),
                    stroke: String(cell.attrs?.body?.stroke || '#000000'),
                    strokeDasharray: String(cell.attrs?.body?.strokeDasharray || '0'),
                    strokeWidth: Number(cell.attrs?.body?.strokeWidth || 1),
                    rx: Number(cell.attrs?.body?.rx || 0),
                    ry: Number(cell.attrs?.body?.ry || 0),
                    valueExp: '',
                    selectEnable: false,
                    animation: false,
                    connector: '',
                    imageUrl: '',
                    svgTemplate: '',
                }
            }
        }
    }

    if (style) {
        if (style.font === '') {
            style.font = '微软雅黑';
        }
        if (style.size === 0) {
            style.size = 12;
        }
        if (style.color === '') {
            style.color = '#000000';
        }
        if (style.fillColor === '') {
            style.fillColor = '#ffffff';
        }
        if (style.stroke === '') {
            style.stroke = '#000000';
        }
        if (style.strokeDasharray === '') {
            style.strokeDasharray = '0';
        }
        if (style.strokeWidth === 0) {
            style.strokeWidth = 1;
        }
        if (style.isBold === false) {
            style.isBold = false;
        }
        if (style.isItalic === false) {
            style.isItalic = false;
        }
        if (style.isUnderline === false) {
            style.isUnderline = false;
        }
    }

    return style;
}


// 3. 创建 Context
const CounterContext = createContext({
  count: 0,
  boardConfigure: null,
  storeBoardConfigureData: () => {},
  increment: () => {},
  decrement: () => {},
  reset: () => {},
  setDisplayRef: () => {},
  displayRef: null
});

// 4. 自定义 Provider 组件（包装子组件，提供 Context）
export function CounterProvider({ children }) {
    const [state, dispatch] = useReducer(counterReducer, initialState);

    // 用 useCallback 稳定 setDisplayRef 引用（依赖 dispatch，而 dispatch 是稳定的）
    const setDisplayRef = useCallback((ref) => {
        dispatch({ type: 'SET_DISPLAY_REF', payload: ref });
    }, [dispatch]); // 仅当 dispatch 变化时才重新创建（实际上不会变）

    // 其他方法也可用 useCallback 优化（可选，根据性能需求）
    const increment = useCallback(() => {
        dispatch({ type: 'INCREMENT' });
    }, [dispatch]);

    const decrement = useCallback(() => {
        dispatch({ type: 'DECREMENT' });
    }, [dispatch]);



    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, [dispatch]);
    const [boardConfigure, setBoardConfigure] = useState<BoardConfigure | null>(() => {
        const saved = localStorage.getItem('sharedBoardData');
        if (saved) {
            return JSON.parse(saved);
        } else {
            return { 
                boardId: "board_1", 
                boardName: "board_1", 
                bgColor: "none", 
                bgImage: null, 
                boardData: null, 
                router: 'normal',
                width: 1500,
                height: 1000,
                nodeDataConfigs: [] 
            }
        }
    });

    const storeBoardConfigureData = (config: BoardConfigure) => {
        localStorage.removeItem("sharedBoardData");
        if (config == null) {
            config = { 
                boardId: "board_1", 
                boardName: "board_1", 
                bgColor: "none", 
                bgImage: null, 
                boardData: null, 
                router: 'normal',
                width: 1500,
                height: 1000,
                nodeDataConfigs: [] 
            };
        }
        localStorage.setItem('sharedBoardData', JSON.stringify(config));
        setBoardConfigure(config);
    };

    // 提供给子组件的上下文值
    const value = {
        count: state.count,
        boardConfigure: boardConfigure,
        storeBoardConfigureData: storeBoardConfigureData,
        increment,
        decrement,
        reset,
        setDisplayRef, // 稳定的函数引用
        displayRef: state.displayRef,
    };

    return (
        <CounterContext.Provider value={value}>
            {children}
        </CounterContext.Provider>
    );
}

// 自定义 Hook 简化 Context 访问
export function useCounter() {
    const context = useContext(CounterContext);
    if (!context) {
        throw new Error('useCounter 必须在 CounterProvider 内部使用');
    }
    return context;
}
