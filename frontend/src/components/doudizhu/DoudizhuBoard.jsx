// src/components/doudizhu/DoudizhuBoard.jsx
import React, { useState } from 'react';
import Card from '../common/Card';
import './Doudizhu.css';
import { useDoudizhuStore, DoudizhuStage } from '../../store/doudizhuStore.js'; // 更新导入路径

const PlayerPosition = {
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
};

const PlayerSeat = ({ player, position, isLandlord, isCurrent }) => (
  <div className={`ddz-player-seat ${position} ${isCurrent ? 'is-current' : ''}`}>
    <div className="player-avatar">
      {isLandlord && <div className="landlord-icon">地主</div>}
      <span>{player.name}</span>
    </div>
    <div className="card-count">{player.hand.length}</div>
  </div>
);

export default function DoudizhuBoard({ onQuit }) {
  const { 
    stage, players, landlordId, landlordCards, currentPlayerId, currentHandOnTable, winnerId,
    playerBid, playerPassBid, playCards, passTurn, startGame
  } = useDoudizhuStore();
  
  const [selectedCards, setSelectedCards] = useState([]);

  const me = players.find(p => p.id === 'player1');
  const leftPlayer = players.find(p => p.id === 'player2');
  const rightPlayer = players.find(p => p.id === 'player3');

  const handleCardClick = (card) => {
    if (stage !== DoudizhuStage.PLAYING) return;
    setSelectedCards(prev => 
      prev.some(c => c.rank === card.rank && c.suit === card.suit)
        ? prev.filter(c => !(c.rank === card.rank && c.suit === card.suit))
        : [...prev, card]
    );
  };
  
  const handlePlay = () => {
    if (selectedCards.length > 0) {
      const success = playCards('player1', selectedCards);
      if (success) {
        setSelectedCards([]);
      }
    }
  };
  const handlePass = () => {
    setSelectedCards([]);
    passTurn('player1');
  };
  const handleBid = (bid) => playerBid('player1', bid);
  const handlePassBid = () => playerPassBid('player1');

  if (!me || !leftPlayer || !rightPlayer) return null;

  const renderActionButtons = () => {
    const myTurn = currentPlayerId === me.id;
    if (!myTurn && stage !== DoudizhuStage.FINISHED) {
      return <div className="action-buttons-placeholder">等待 {players.find(p=>p.id === currentPlayerId)?.name} 操作...</div>;
    }

    if (stage === DoudizhuStage.BIDDING) {
      const bidState = useDoudizhuStore.getState().biddingState;
      return (
        <div className="action-buttons">
          <button className="ddz-btn" onClick={handlePassBid}>不叫</button>
          {bidState.highestBid < 1 && <button className="ddz-btn primary" onClick={() => handleBid(1)}>1分</button>}
          {bidState.highestBid < 2 && <button className="ddz-btn primary" onClick={() => handleBid(2)}>2分</button>}
          {bidState.highestBid < 3 && <button className="ddz-btn primary" onClick={() => handleBid(3)}>3分</button>}
        </div>
      );
    }

    if (stage === DoudizhuStage.PLAYING) {
      const canPass = !!currentHandOnTable && currentPlayerId !== (useDoudizhuStore.getState().lastPlayerId || currentPlayerId);
      return (
        <div className="action-buttons">
          <button className="ddz-btn" onClick={handlePass} disabled={!canPass}>不出</button>
          <button className="ddz-btn">提示</button>
          <button className="ddz-btn primary" onClick={handlePlay} disabled={selectedCards.length === 0}>出牌</button>
        </div>
      );
    }

    if (stage === DoudizhuStage.FINISHED) {
        const isWinner = winnerId === me.id;
        const isLandlordWinner = winnerId === landlordId;
        const amILandlord = me.id === landlordId;
        const message = (isWinner) ? "胜利！" : "失败";
        const finalMessage = `${message} - ${ (amILandlord === isLandlordWinner) ? "地主" : "农民" }阵营获胜`;

        return (
            <div className="action-buttons">
                <div className="game-over-message">{finalMessage}</div>
                <button className="ddz-btn primary" onClick={startGame}>再来一局</button>
            </div>
        );
    }
    return null;
  }

  return (
    <div className="ddz-board-container">
      <div className="ddz-top-bar">
        <button className="ddz-quit-btn" onClick={onQuit}>{'< 返回大厅'}</button>
        <div className="landlord-cards-display">
          {stage === DoudizhuStage.PLAYING && landlordCards.map((card, i) => <Card key={i} card={card} />)}
        </div>
        <div className="room-info"></div>
      </div>

      <div className="ddz-main-area">
        <PlayerSeat player={leftPlayer} position="left" isLandlord={landlordId === leftPlayer.id} isCurrent={currentPlayerId === leftPlayer.id} />
        
        <div className="center-table">
          <div className="played-cards-area">
            {currentHandOnTable && currentHandOnTable.cards.map(card => (
                <Card key={`${card.rank}-${card.suit}`} card={card} />
            ))}
          </div>
        </div>
        
        <PlayerSeat player={rightPlayer} position="right" isLandlord={landlordId === rightPlayer.id} isCurrent={currentPlayerId === rightPlayer.id} />
      </div>

      <div className="ddz-player-area">
        <PlayerSeat player={me} position="bottom" isLandlord={landlordId === me.id} isCurrent={currentPlayerId === me.id} />
        
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
        
        {renderActionButtons()}
      </div>
    </div>
  );
}
