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
        fontSize: 'clamp(28px, 6vw, 36px)', // 响应式字体
        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        marginBottom: 'clamp(20px, 4vh, 40px)', // 响应式间距
        textAlign: 'center'
      }}>
        棋牌游戏大厅
      </h1>
      
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 'clamp(15px, 3vw, 30px)', // 响应式间距
        width: '100%',
        maxWidth: '1200px'
      }}>
        {/* 十三水游戏入口 */}
        <div 
          style={{
            ...gameCardStyle,
            flex: '1 1 clamp(280px, 30vw, 350px)' // 响应式宽度
          }}
          onClick={() => navigate('/thirteen-water')}
        >
          <div style={gameIconStyle}>♠️♥️♦️♣️</div>
          <h2 style={gameTitleStyle}>十三水</h2>
          <p style={gameDescStyle}>传统扑克游戏，考验牌技与策略</p>
          <button style={playButtonStyle}>进入游戏</button>
        </div>
        
        {/* 斗地主游戏入口（占位） */}
        <div style={{
          ...gameCardStyle,
          flex: '1 1 clamp(280px, 30vw, 350px)' // 响应式宽度
        }}>
          <div style={gameIconStyle}>🃏👨‍🌾👑</div>
          <h2 style={gameTitleStyle}>斗地主</h2>
          <p style={gameDescStyle}>热门扑克游戏，三人对战</p>
          <button style={disabledButtonStyle}>开发中</button>
        </div>
        
        {/* 锄大地游戏入口（占位） */}
        <div style={{
          ...gameCardStyle,
          flex: '1 1 clamp(280px, 30vw, 350px)' // 响应式宽度
        }}>
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
  padding: 'clamp(15px, 3vw, 30px)', // 响应式内边距
  textAlign: 'center',
  backdropFilter: 'blur(10px)',
  border: '2px solid #ffcc00',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  cursor: 'pointer',
  transition: 'transform 0.3s, box-shadow 0.3s',
  minWidth: '280px',
  maxWidth: '100%',
  marginBottom: '10px'
};

const gameIconStyle = {
  fontSize: 'clamp(40px, 8vw, 60px)', // 响应式图标
  marginBottom: 'clamp(10px, 2vw, 20px)'
};

const gameTitleStyle = {
  color: '#ffcc00',
  fontSize: 'clamp(22px, 4.5vw, 28px)', // 响应式标题
  marginBottom: 'clamp(8px, 1.5vw, 15px)'
};

const gameDescStyle = {
  color: '#e0f7e9',
  fontSize: 'clamp(14px, 3vw, 18px)', // 响应式描述
  marginBottom: 'clamp(15px, 3vw, 25px)',
  lineHeight: 1.4
};

const playButtonStyle = {
  background: 'linear-gradient(90deg, #ffcc00, #ffaa00)',
  color: '#1a462a',
  border: 'none',
  borderRadius: 10,
  padding: 'clamp(8px, 1.5vw, 12px) clamp(15px, 3vw, 30px)', // 响应式按钮
  fontSize: 'clamp(14px, 3vw, 18px)', // 响应式字体
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(255, 204, 0, 0.3)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  width: '100%',
  maxWidth: '200px'
};

const disabledButtonStyle = {
  ...playButtonStyle,
  background: 'linear-gradient(90deg, #95a5a6, #7f8c8d)',
  cursor: 'not-allowed',
  boxShadow: 'none'
};