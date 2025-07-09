jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css'; // 确保 App.css 也在 App 组件导入前
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);