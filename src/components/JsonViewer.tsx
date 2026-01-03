import React from 'react';
interface JsonViewerProps {
    data: any;
    depth?: number; // 控制最大展示层级，防止无限递归
}
const JsonViewer: React.FC<JsonViewerProps> = ({ data, depth = 3 }) => {
    // 辅助函数：处理嵌套数据
    const renderValue = (value: any, key?: string, currentDepth: number = 0): JSX.Element => {
        // 如果达到最大深度或不是对象/数组，则直接返回文本
        if (currentDepth >= depth || typeof value !== 'object' || value === null) {
            return <span>{JSON.stringify(value)}</span>;
        }
        // 处理数组
        if (Array.isArray(value)) {
            return (
                <div style={{ paddingLeft: '5px',  marginLeft: '5px' }}>
                    <strong>{key}: [Array]</strong>
                    <ul style={{ paddingLeft: '2px', marginTop: '5px' }}>
                        {value.map((item, index) => (
                            <li key={index}>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <span >Index {index}</span>
                                    {renderValue(item, undefined, currentDepth + 1)}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }
        // 处理普通对象
        return (
            <div style={{ paddingLeft: '5px',  marginLeft: '2px' }}>
                <strong>{key}: {typeof value}</strong>
                <ul style={{ paddingLeft: '5px', marginTop: '2px' }}>
                    {Object.entries(value).map(([k, v]) => (
                        <li key={k}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <span >{k}</span>
                                {renderValue(v, k, currentDepth + 1)}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };
    return (
        <div style={{ fontFamily: 'monospace', padding: '5px', borderRadius: '2px' }}>
            <pre style={{ margin: 0, color: '#333' }}>{JSON.stringify(data, null, 2)}</pre>
            {/* <div style={{ marginTop: '10px' }}>
                {renderValue(data)}
            </div> */}
        </div>
    );
};
export default JsonViewer;
