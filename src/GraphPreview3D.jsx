import React from 'react';
import ReactDOM from 'react-dom/client';
import Simple3DViewer from './pages/Simple3DViewer';

// 获取root元素并渲染React组件
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Simple3DViewer />
  </React.StrictMode>
);
