import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function GameLobby() {
  const navigate = useNavigate();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0d4d2b 0%, #1a6d3b 100%)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: '"Helvetica Neue", Arial, sans-serif'
    }}>
      <h1 style={{
        color: '#ffcc00',
        fontSize: 36,
        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        marginBottom: 40
      }}>
        棋牌游戏大厅
      </h1>
      
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 30,
        width: '90%', // 调整宽度以适应屏幕
      }}>
        {/* 十三水游戏入口 */}
        <div 
          style={gameCardStyle}
          onClick={() => navigate('/thirteen-water')}
        >
          <div style={gameIconStyle}>♠️♥️♦️♣️</div>
          <h2 style={gameTitleStyle}>十三水</h2>
          <p style={gameDescStyle}>传统扑克游戏，考验牌技与策略</p>
          <button style={playButtonStyle}>进入游戏</button>
        </div>
        
        {/* 斗地主游戏入口（占位） */}
        <div style={gameCardStyle}>
          <div style={gameIconStyle}>🃏👨‍🌾👑</div>
          <h2 style={gameTitleStyle}>斗地主</h2>
          <p style={gameDescStyle}>热门扑克游戏，三人对战</p>
          <button style={disabledButtonStyle}>开发中</button>
        </div>
        
        {/* 锄大地游戏入口（占位） */}
        <div style={gameCardStyle}>
          <div style={gameIconStyle}>🪓🌄🃏</div>
          <h2 style={gameTitleStyle}>锄大地</h2>
          <p style={gameDescStyle}>经典扑克玩法，流行于华南地区</p>
          <button style={disabledButtonStyle}>开发中</button>
        </div>
      </div>
    </div>
  );
}

// 样式常量
const gameCardStyle = {
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 20,
  padding: 30,
  textAlign: 'center',
  backdropFilter: 'blur(10px)',
  border: '2px solid #ffcc00',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  cursor: 'pointer',
  transition: 'transform 0.3s, box-shadow 0.3s',
  width: 'auto', // 使用 auto 宽度
  minWidth: '300px', // 保持最小宽度
  flex: '1 1 300px' // Flex 属性，允许自动调整大小
};

const gameIconStyle = {
  fontSize: 60,
  marginBottom: 20
};

const gameTitleStyle = {
  color: '#ffcc00',
  fontSize: 28,
  marginBottom: 15
};

const gameDescStyle = {
  color: '#e0f7e9',
  fontSize: 18,
  marginBottom: 25
};

const playButtonStyle = {
  background: 'linear-gradient(90deg, #ffcc00, #ffaa00)',
  color: '#1a462a',
  border: 'none',
  borderRadius: 10,
  padding: '12px 30px',
  fontSize: 18,
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(255, 204, 0, 0.3)',
  transition: 'transform 0.2s, box-shadow 0.2s'
};

const disabledButtonStyle = {
  ...playButtonStyle,
  background: 'linear-gradient(90deg, #95a5a6, #7f8c8d)',
  cursor: 'not-allowed',
  boxShadow: 'none'
};