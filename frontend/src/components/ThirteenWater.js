/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Play.css';

// 移除固定像素尺寸定义

const AI_NAMES = ['小明', '小红', '小刚'];

export default function ThirteenWater() {
  const navigate = useNavigate();
  const [head, setHead] = useState([]);
  const [middle, setMiddle] = useState([]);
  const [tail, setTail] = useState([]);
  const [selected, setSelected] = useState({ area: '', cards: [] });
  const [msg, setMsg] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [aiProcessed] = useState([false, false, false]);

  function handleReady() {
    setIsReady(!isReady);
    setMsg(isReady ? '已取消准备' : '准备中...');
  }

  function renderCard(card, isSelected) {
    // 动态计算卡片尺寸
    const cardWidthPx = Math.min(window.innerWidth * 0.12, 50); // 示例：卡片宽度最大50px，或视口宽度的12%
    const cardHeightPx = cardWidthPx * (90 / 60); // 保持宽高比

    return (
      <div 
        className={`card ${isSelected ? 'selected' : ''}`}
        style={{
          width: `${cardWidthPx}px`,
          height: `${cardHeightPx}px`,
          borderRadius: 8,
          background: '#fff',
          boxShadow: isSelected 
            ? '0 0 0 3px #ffcc00, 0 4px 12px rgba(0,0,0,0.2)' 
            : '0 2px 6px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 1px', // 调整边距
        }}
      >
        <div style={{ fontSize: `${cardWidthPx * 0.4}px`, fontWeight: 'bold', color: '#333' }}>
          {card || '?'}
        </div>
      </div>
    );
  }

  function renderPaiDunCards(arr, area) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 2, // 调整间距
        // minHeight: CARD_HEIGHT + 20, // 原始常量不再存在，移除此行
        alignItems: 'center',
        padding: '5px' // 添加内边距防止卡片紧贴边缘
      }}>
        {arr.length === 0 ? (
          <div style={{
            color: '#a3c6b3',
            fontSize: 16,
            fontStyle: 'italic'
          }}>
            点击放置牌
          </div>
        ) : (
          arr.map((card, idx) => renderCard(card, false))
        )}
      </div>
    );
  }

  function renderPaiDun(arr, label, area) {
    return (
      <div
        className="pai-dun-container"
        style={{
          width: '100%',
          borderRadius: 16,
          background: 'rgba(26, 109, 59, 0.7)',
          // minHeight: 150, // 可以考虑移除或调整，让内容决定高度
          marginBottom: 20,
          position: 'relative',
          boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
          padding: 20,
          border: '2px solid #1a6d3b'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 10,
          left: 15,
          color: '#ffcc00',
          fontSize: 18,
          fontWeight: 700,
          background: 'rgba(0,0,0,0.3)',
          padding: '4px 12px',
          borderRadius: 20
        }}>
          {label}墩
          <span style={{ marginLeft: 8, color: '#fff' }}>({arr.length}张)</span>
        </div>
        {renderPaiDunCards(arr, area)}
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0d4d2b 0%, #1a6d3b 100%)',
      minHeight: '100vh',
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      // padding: '20px 0', // 移除垂直 padding，让内容撑满
      display: 'flex', // 使用flexbox布局
      flexDirection: 'column', // 垂直排列
      alignItems: 'center', // 水平居中
      justifyContent: 'space-between', // 内容之间分配空间
    }}>
      <div style={{
        // maxWidth: OUTER_MAX_WIDTH, // 移除固定最大宽度，使用百分比
        width: '95%', // 调整为百分比宽度
        margin: '0 auto',
        background: 'rgba(26, 109, 59, 0.85)',
        borderRadius: 25,
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        padding: 20,
        border: '2px solid #ffcc00',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '90vh', // 保持最小高度
        boxSizing: 'border-box'
      }}>
        {/* 顶部：标题和退出按钮 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 20,
          borderBottom: '2px solid #ffcc00',
          paddingBottom: 15
        }}>
          <h1 style={{
            color: '#ffcc00',
            fontSize: 24,
            margin: 0,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            十三水游戏
          </h1>
          
          <button
            style={{
              background: 'linear-gradient(90deg, #e74c3c, #c0392b)',
              color: '#fff',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: 8,
              padding: '8px 15px',
              cursor: 'pointer',
              fontSize: 16,
              boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={() => navigate('/')}
          >
            <span style={{ marginRight: 5 }}>←</span> 返回大厅
          </button>
        </div>
        
        {/* 玩家区 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: 25,
          gap: 10
        }}>
          <div className="play-seat" style={playerSeatStyle(true)}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>你</div>
            <div style={{ fontSize: 14, fontWeight: 400 }}>
              {isReady ? '已准备' : '未准备'}
            </div>
          </div>
          {['小明', '小红', '小刚'].map((name, idx) => (
            <div key={idx} className="play-seat" style={playerSeatStyle(false)}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{name}</div>
              <div style={{ fontSize: 14, fontWeight: 400 }}>
                {aiProcessed[idx] ? '已准备' : '准备中...'}
              </div>
            </div>
          ))}
        </div>
        
        {/* 牌墩区域 */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 15,
          marginBottom: 25
        }}>
          {renderPaiDun(head, '头')}
          {renderPaiDun(middle, '中')}
          {renderPaiDun(tail, '尾')}
        </div>
        
        {/* 按钮区 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: 12,
          marginTop: 'auto'
        }}>
          <button
            className="game-btn"
            style={{
              background: isReady
                ? '#95a5a6'
                : 'linear-gradient(90deg, #2ecc71, #27ae60)',
            }}
            onClick={handleReady}
          >
            {isReady ? '取消准备' : '开始准备'}
          </button>
          
          <button
            className="game-btn"
            style={{
              background: 'linear-gradient(90deg, #3498db, #2980b9)',
              opacity: isReady ? 1 : 0.6
            }}
            disabled={!isReady}
          >
            智能分牌
          </button>
          
          <button
            className="game-btn"
            style={{
              background: '#95a5a6',
            }}
            disabled={true}
          >
            开始比牌
          </button>
        </div>
        
        {/* 消息区域 */}
        <div style={{ 
          color: '#ffcc00', 
          textAlign: 'center', 
          fontSize: 16, 
          minHeight: 24,
          marginTop: 15,
          fontWeight: 500
        }}>
          {msg || '等待操作...'}
        </div>
      </div>
    </div>
  );
}

// 玩家座位样式
function playerSeatStyle(isMe) {
  return {
    border: '1px solid #1a6d3b',
    borderRadius: 12,
    // marginRight: 8, // 移除固定右边距，使用gap
    width: '22%',
    minWidth: 70,
    color: isMe ? '#fff' : '#ccc',
    background: isMe ? '#1a6d3b' : '#2a556e',
    textAlign: 'center',
    padding: '10px 0',
    fontWeight: 700,
    fontSize: 16,
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    transition: 'all 0.3s',
    opacity: 0.8,
    boxSizing: 'border-box' // 确保padding不会导致溢出
  };
}