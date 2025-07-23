import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ React 应用已挂载");
  } else {
    console.error("❌ 挂载失败：找不到 #root");
  }
});
