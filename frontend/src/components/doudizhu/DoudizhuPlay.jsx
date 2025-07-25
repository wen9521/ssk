// src/components/doudizhu/DoudizhuPlay.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoudizhuStage, useDoudizhuStore } from '../../utils/doudizhu-store';
// import DoudizhuBoard from './DoudizhuBoard'; // 我们稍后会创建这个组件

export default function DoudizhuPlay() {
  const navigate = useNavigate();
  const { startGame } = useDoudizhuStore();

  useEffect(() => {
    startGame();
  }, [startGame]);

  const handleQuit = () => {
    navigate('/');
  };

  return (
    <div>
      <h1>斗地主开发中...</h1>
      <button onClick={handleQuit}>返回大厅</button>
      {/* 游戏主面板将在这里渲染 */}
      {/* <DoudizhuBoard /> */}
    </div>
  );
}