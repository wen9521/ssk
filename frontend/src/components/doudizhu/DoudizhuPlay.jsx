// src/components/doudizhu/DoudizhuPlay.jsx
import React, { useState } from 'react';
import { DoudizhuStage } from '../../store/doudizhuStore';

export default function DoudizhuPlay({
  me, stage, biddingState,
  currentHandOnTable, lastPlayerId,
  winnerId, landlordId,
  bid, passBid, play, pass, startGame
}) {
  const [selected, setSelected] = useState([]);

  if (!me) return null;
  const myTurn = me.id === (stage === DoudizhuStage.BIDDING
    ? biddingState.currentPlayerId
    : me.id);

  // 叫分阶段
  if (stage === DoudizhuStage.BIDDING && myTurn) {
    return (
      <div className="controls">
        <button onClick={()=>passBid(me.id)}>不叫</button>
        {[1,2,3].map(n=>(n          biddingState.highestBid < n && (
            <button key={n} onClick={()=>bid(me.id, n)}>{n} 分</button>
          )
        ))}
      </div>
    );
  }

  // 出牌阶段
  if (stage === DoudizhuStage.PLAYING && myTurn) {
    return (
      <div className="controls">
        <button
          disabled={!currentHandOnTable || lastPlayerId === me.id}
          onClick={()=>{ setSelected([]); pass(me.id); }}
        >
          不出
        </button>
        <button className="hint">提示</button>
        <button
          disabled={!selected.length}
          onClick={()=>{
            play(me.id, selected);
            setSelected([]);
          }}
        >
          出牌
        </button>
      </div>
    );
  }

  // 游戏结束
  if (stage === DoudizhuStage.FINISHED) {
    const win = winnerId === me.id;
    const camp = landlordId === winnerId ? '地主' : '农民';
    return (
      <div className="controls">
        <div className="result">
          {win ? '胜利' : '失败'} — {camp} 获胜
        </div>
        <button onClick={startGame}>再来一局</button>
      </div>
    );
  }

  return <div className="controls">等待回合…</div>;
}