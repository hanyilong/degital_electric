import React from 'react';
import ReactDOM from 'react-dom/client';
import Cabinet3DView from './pages/Cabinet3DView';

// 获取root元素并渲染React组件
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Cabinet3DView />
  </React.StrictMode>
);