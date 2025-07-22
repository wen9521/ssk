import React, { useState, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import Hand from './Hand';
import { toCardFilename } from '../utils/card-utils';
import './Play.css';

const WS_URL = 'ws://127.0.0.1:8080'; // 在本地开发时，请确保后端服务已启动

// Reducer to manage complex game state
function gameReducer(state, action) {
  switch (action.type) {
    case 'GAME_STATE_UPDATE':
      return { ...state, ...action.payload };
    case 'PLAYER_HAND_UPDATE':
      return { ...state, myHand: action.payload };
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    case 'SET_MESSAGE':
      return { ...state, message: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const initialState = {
  socket: null,
  message: '',
  players: [],
  status: 'connecting',
  myHand: [],
  submittedHands: {},
  scores: {},
};

export default function Play() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { socket, message, players, status, myHand, submittedHands, scores } = state;

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      dispatch({ type: 'SET_SOCKET', payload: ws });
      dispatch({ type: 'GAME_STATE_UPDATE', payload: { status: 'waiting' } });
      dispatch({ type: 'SET_MESSAGE', payload: '已连接到服务器' });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);

      switch (data.type) {
        case 'game_state':
          dispatch({ type: 'GAME_STATE_UPDATE', payload: data.payload });
          break;
        case 'player_hand':
          dispatch({ type: 'PLAYER_HAND_UPDATE', payload: data.payload });
          break;
        case 'error':
          dispatch({ type: 'SET_MESSAGE', payload: `错误: ${data.payload}` });
          break;
        default:
          break;
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      dispatch({ type: 'SET_MESSAGE', payload: '与服务器断开连接' });
      dispatch({ type: 'RESET' });
    };

    ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        dispatch({ type: 'SET_MESSAGE', payload: 'WebSocket 连接出错' });
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = (type, payload = {}) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, ...payload }));
    }
  };

  const handleStartGame = () => {
    sendMessage('start_game');
  };

  const handleSubmitHand = (hand) => {
    // Hand will be an object with { head, middle, tail }
    sendMessage('submit_hand', { hand });
  };

  return (
    <div className="play-container">
        <div className="game-wrapper">
            <div className="game-header">
                <button className="btn-quit" onClick={() => navigate('/')}>
                    &lt; 退出房间
                </button>
                <div className="score-display">
                    <span role="img" aria-label="coin" className="coin-icon">🪙</span>
                    积分: {scores[socket?.resourceId] || 0}
                </div>
            </div>

            <GameBoard players={players} status={status} />

            <Hand
                cards={myHand}
                onSubmit={handleSubmitHand}
                gameStatus={status}
            />

            <div className="actions-area">
                <button
                    className="btn-action btn-ready"
                    onClick={handleStartGame}
                    disabled={status !== 'waiting' || players.length < 2}
                >
                    开始游戏
                </button>
            </div>
            
            <div className="message-area">{message}</div>
        </div>
    </div>
  );
}
