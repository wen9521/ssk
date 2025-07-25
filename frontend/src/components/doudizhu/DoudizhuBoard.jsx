// src/components/doudizhu/DoudizhuBoard.jsx
import React, { useState } from 'react';
import Card from '../Card'; // 复用卡牌组件
import './Doudizhu.css'; // 斗地主专属样式
import { useDoudizhuStore } from '../../utils/doudizhu-store';

const PlayerPosition = {
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
};

// 玩家座位组件
const PlayerSeat = ({ player, position, isLandlord, isCurrent }) => (
  <div className={`ddz-player-seat ${position} ${isCurrent ? 'is-current' : ''}`}>
    <div className="player-avatar">
      {isLandlord && <div className="landlord-icon">地主</div>}
      <span>{player.name}</span>
    </div>
    <div className="card-count">{player.hand.length}</div>
  </div>
);

// 主面板
export default function DoudizhuBoard({ onQuit }) {
  const { players, landlordId, landlordCards, currentPlayerId, currentHand } = useDoudizhuStore();
  const [selectedCards, setSelectedCards] = useState([]);

  const me = players.find(p => p.id === 'player1');
  const leftPlayer = players.find(p => p.id === 'player2');
  const rightPlayer = players.find(p => p.id === 'player3');

  const handleCardClick = (card) => {
    setSelectedCards(prev => 
      prev.some(c => c.rank === card.rank && c.suit === card.suit)
        ? prev.filter(c => !(c.rank === card.rank && c.suit === card.suit))
        : [...prev, card]
    );
  };

  if (!me || !leftPlayer || !rightPlayer) return null;

  return (
    <div className="ddz-board-container">
      <div className="ddz-top-bar">
        <button className="ddz-quit-btn" onClick={onQuit}>< 返回大厅</button>
        <div className="landlord-cards-display">
          {landlordCards.map((card, i) => <Card key={i} card={card} />)}
        </div>
        <div className="room-info">房间号: 12345</div>
      </div>

      <div className="ddz-main-area">
        <PlayerSeat player={leftPlayer} position={PlayerPosition.LEFT} isLandlord={landlordId === leftPlayer.id} isCurrent={currentPlayerId === leftPlayer.id} />
        
        <div className="center-table">
          <div className="played-cards-area">
            {/* 显示上家打出的牌 */}
          </div>
        </div>
        
        <PlayerSeat player={rightPlayer} position={PlayerPosition.RIGHT} isLandlord={landlordId === rightPlayer.id} isCurrent={currentPlayerId === rightPlayer.id} />
      </div>

      <div className="ddz-player-area">
        <PlayerSeat player={me} position={PlayerPosition.BOTTOM} isLandlord={landlordId === me.id} isCurrent={currentPlayerId === me.id} />
        
        <div className="my-hand-area">
          {me.hand.map(card => (
            <Card 
              key={`${card.rank}-${card.suit}`}
              card={card}
              isSelected={selectedCards.some(c => c.rank === card.rank && c.suit === card.suit)}
              onClick={() => handleCardClick(card)}
            />
          ))}
        </div>
        
        <div className="action-buttons">
          <button className="ddz-btn">不出</button>
          <button className="ddz-btn">提示</button>
          <button className="ddz-btn primary">出牌</button>
        </div>
      </div>
    </div>
  );
}