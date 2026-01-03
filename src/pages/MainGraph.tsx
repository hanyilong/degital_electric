import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GraphApp from './GraphApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <Router>
        {/* 路由匹配规则 */}
        <Routes>
          <Route path="/" element={<GraphApp />} />
        </Routes>
      </Router>
  </StrictMode>,
)