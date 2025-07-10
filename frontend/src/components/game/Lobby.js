// src/components/game/Lobby.js
import React from 'react';
import '../../styles/Lobby.css'; 

const Lobby = ({ onReady }) => {
  return (
    <div className="lobby-container" style={{
        background: '#164b2e',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
    }}>
      <div className="game-title">
        <h1>十三水</h1>
        <p className="subtitle">MERN 全栈扑克游戏</p>
      </div>

      <div className="game-options">
        <button 
          onClick={onReady} // Changed from onStartTryPlay to onReady
          className="option-button" 
          style={{
            background: 'linear-gradient(90deg,#23e67a 80%,#43ffb8 100%)',
            color: '#fff',
            fontWeight: 700,
            border: 'none',
            borderRadius: 10,
            padding: '20px 40px',
            fontSize: '1.5em',
            cursor: 'pointer',
            boxShadow: '0 4px 15px #23e67a55'
          }}
        >
          开始游戏
        </button>
      </div>
    </div>
  );
};

export default Lobby;
