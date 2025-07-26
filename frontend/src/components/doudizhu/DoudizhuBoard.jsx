// src/components/doudizhu/DoudizhuBoard.jsx
import React, { useEffect } from 'react';
import { useDoudizhuStore, DoudizhuStage } from '../../store/doudizhuStore';
import DoudizhuPlay from './DoudizhuPlay';
import { decideBid, decidePlay } from '../../game-logic/doudizhu.ai';
import './Doudizhu.css';

export default function DoudizhuBoard() {
  const {
    stage, players, landlordId, landlordCards,
    currentPlayerId, currentHandOnTable, lastPlayerId,
    biddingState, winnerId,
    startGame, bid, passBid, play, pass
  } = useDoudizhuStore();

  useEffect(() => {
    startGame();
  }, [startGame]);

  // AI自动出牌/叫分
  useEffect(() => {
    const cur = players.find(p=>p.id===currentPlayerId);
    if (!cur?.isAI) return;
    const t = setTimeout(() => {
      if (stage === DoudizhuStage.BIDDING) {
        const score = decideBid(cur.hand, biddingState.highestBid);
        score ? bid(cur.id, score) : passBid(cur.id);
      } else if (stage === DoudizhuStage.PLAYING) {
        const cards = decidePlay(cur.hand, currentHandOnTable);
        cards ? play(cur.id, cards) : pass(cur.id);
      }
    }, 600);
    return ()=>clearTimeout(t);
  }, [currentPlayerId, stage]);

  return (
    <div className="ddz-board">
      <header className="ddz-header">
        <button onClick={startGame}>重置</button>
        <div className="landlord-cards">
          {stage === DoudizhuStage.PLAYING && landlordCards.map((c,i)=>(n            <span key={i}>{c.rank}</span>
          ))}
        </div>
      </header>
      <main className="ddz-main">
        {players.map((p, idx)=>(n          <div
            key={p.id}
            className={`seat seat-${idx} ${p.id===currentPlayerId?'active':''}`}
          >
            <div className="seat-info">
              <span>{p.name}</span>
              {p.id === landlordId && <span className="tag">地主</span>}
            </div>
            <div className="seat-cards">
              {idx===0
                ? p.hand.map((c,i)=><span key={i}>{c.rank}</span>)
                : <span>×{p.hand.length}</span>
              }
            </div>
          </div>
        ))}
      </main>
      <footer className="ddz-footer">
        <DoudizhuPlay
          me={players[0]}
          stage={stage}
          biddingState={biddingState}
          currentHandOnTable={currentHandOnTable}
          lastPlayerId={lastPlayerId}
          winnerId={winnerId}
          landlordId={landlordId}
          bid={bid}
          passBid={passBid}
          play={play}
          pass={pass}
          startGame={startGame}
        />
      </footer>
    </div>
  );
}