import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react'
import { CounterProvider } from './graph-context';
import PreviewGraph from './components/PreviewGraph';

// 获取挂载点
const rootElement = document.getElementById('previewRoot');
if (!rootElement) {
  throw new Error('找不到id为previewRoots的元素');
}

// 创建根节点并渲染UserPage组件
const root = ReactDOM.createRoot(rootElement);
root.render(
  <StrictMode>
    <CounterProvider>
      <div>
        <PreviewGraph />
      </div>
    </CounterProvider>
  </StrictMode>
);