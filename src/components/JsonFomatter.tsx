import React, { useState } from 'react';
import './JsonFormatter.css'; // 我们会在下面定义样式

// 定义 JSON 节点的类型
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue; }
interface JsonArray extends Array<JsonValue> {}

// 定义折叠状态的类型
type CollapsedState = { [key: string]: boolean };

// JSON 格式化展示组件
interface JsonFormatterProps {
  data: JsonValue;       // 要展示的 JSON 数据
  indentSize?: number;   // 缩进大小，默认 2
  rootName?: string;     // 根节点名称，默认空
}

const JsonFormatter: React.FC<JsonFormatterProps> = ({
  data,
  indentSize = 2,
  rootName = ''
}) => {
  // 管理折叠状态
  const [collapsed, setCollapsed] = useState<CollapsedState>({});

  // 切换节点的折叠/展开状态
  const toggleCollapsed = (path: string) => {
    setCollapsed(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // 判断值的类型并返回对应的样式类名
  const getTypeClass = (value: JsonValue) => {
    if (typeof value === 'string') return 'json-string';
    if (typeof value === 'number') return 'json-number';
    if (typeof value === 'boolean') return 'json-boolean';
    if (value === null) return 'json-null';
    return '';
  };

  // 格式化值的显示
  const formatValue = (value: JsonValue) => {
    if (typeof value === 'string') return `"${value}"`;
    if (value === null) return 'null';
    return String(value);
  };

  // 递归渲染 JSON 节点
  const renderJson = (data: JsonValue, path: string = '', isRoot = false) => {
    // 如果是对象或数组
    if (typeof data === 'object' && data !== null) {
      const isArray = Array.isArray(data);
      const keys = isArray ? Object.keys(data) : Object.keys(data).sort();
      const isEmpty = keys.length === 0;
      
      // 处理折叠逻辑
      const isCollapsed = collapsed[path] && !isEmpty;
      
      // 渲染折叠/展开按钮
      const toggleButton = (
        <span 
          className="json-toggle"
          onClick={() => toggleCollapsed(path)}
        >
          {isCollapsed ? '+' : '-'}
        </span>
      );

      // 渲染节点头部
      const nodeHeader = (
        <span className="json-node-header">
          {!isRoot && toggleButton}
          {isArray ? '[' : '{'}
          {!isEmpty && (isCollapsed ? ` ... ${isArray ? ']' : '}'}` : '')}
        </span>
      );

      if (isCollapsed || isEmpty) {
        return (
          <span className="json-node">
            {nodeHeader}
            {isEmpty && (isArray ? ']' : '}')}
          </span>
        );
      }

      // 渲染子节点
      const children = keys.map((key, index) => {
        const childPath = `${path}/${key}`;
        const isLast = index === keys.length - 1;
        const childValue = (data as JsonObject | JsonArray)[key];
        
        return (
          <div key={childPath} className="json-child">
            <span style={{ paddingLeft: `${indentSize}px` }}></span>
            {isArray ? null : (
              <span className="json-key">" {key} "</span>
            )}
            {!isArray && <span>:</span>}
            {renderJson(childValue, childPath)}
            {!isLast && <span className="json-comma">,</span>}
          </div>
        );
      });

      return (
        <span className="json-node">
          {nodeHeader}
          <div className="json-children">{children}</div>
          <span className="json-node-footer">{isArray ? ']' : '}'}</span>
        </span>
      );
    }

    // 基本类型值
    return (
      <span className={`json-value ${getTypeClass(data)}`}>
        {formatValue(data)}
      </span>
    );
  };

  return (
    <div className="json-formatter">
      {rootName && <span className="json-root-name">{rootName}: </span>}
      {renderJson(data, 'root', true)}
    </div>
  );
};

export default JsonFormatter