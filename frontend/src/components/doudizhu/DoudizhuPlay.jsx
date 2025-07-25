// src/components/doudizhu/DoudizhuPlay.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDoudizhuStore } from '@/utils/doudizhu.store.js';
import DoudizhuBoard from './DoudizhuBoard';
import './Doudizhu.css';

// --- 全屏和横屏辅助函数 ---
const requestLandscape = async () => {
  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
    // 尝试锁定为横屏
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch (err) {
    console.warn("请求横屏失败:", err);
  }
};

const exitLandscape = async () => {
  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch (err) {
    console.warn("退出横屏失败:", err);
  }
};

export default function DoudizhuPlay() {
  const navigate = useNavigate();
  const startGame = useDoudizhuStore(state => state.startGame);

  useEffect(() => {
    // 组件加载时开始游戏并请求横屏
    startGame();
    requestLandscape();

    // 组件卸载时退出横屏模式
    return () => {
      exitLandscape();
    };
  }, [startGame]);

  const handleQuit = () => {
    navigate('/');
  };

  return (
    // 添加一个遮罩层，用于在竖屏时提示用户
    <>
      <div className="force-landscape-overlay">
        <p>为了最佳游戏体验</p>
        <p>请旋转您的设备</p>
      </div>
      <DoudizhuBoard onQuit={handleQuit} />
    </>
  );
}
