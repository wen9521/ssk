import React, { useState } from 'react';
import { useDoudizhuStore } from '../../store/doudizhuStore';
import { DoudizhuStage } from '../../game-logic';

export default function DoudizhuPlay({
  me, // 仍然需要知道'我'是谁
  // 从父组件接收状态
  stage,
  biddingState,
  currentHandOnTable,
  lastPlayerId,
  winnerId,
  landlordId,
  currentPlayerId
}) {
  // 让组件自己管理选中的牌
  const [selectedCards, setSelectedCards] = useState([]);
  
  // 从Store中获取actions
  const { bid, passBid, play, pass, startGame } = useDoudizhuStore();

  if (!me) return null;

  // 修复后的回合判断逻辑
  const isMyBidTurn = stage === DoudizhuStage.BIDDING && me.id === biddingState?.currentPlayerId;
  const isMyPlayTurn = stage === DoudizhuStage.PLAYING && me.id === currentPlayerId;

  // 叫分阶段
  if (isMyBidTurn) {
    const availableBids = [1, 2, 3].filter(n => n > biddingState.highestBid);
    return (
      <div className="controls">
        <button onClick={() => passBid(me.id)}>不叫</button>
        {availableBids.map(n => (
          <button key={n} onClick={() => bid(me.id, n)}>
            {n} 分
          </button>
        ))}
      </div>
    );
  }

  // 出牌阶段
  if (isMyPlayTurn) {
    const canPass = currentHandOnTable !== null && lastPlayerId !== me.id;
    return (
      <div className="controls">
        <button disabled={!canPass} onClick={() => pass(me.id)}>
          不出
        </button>
        <button
          className="hint"
          // onClick={...} // 提示功能的逻辑
        >
          提示
        </button>
        <button
          disabled={selectedCards.length === 0} // 假设selectedCards是通过点击Hand组件更新的
          onClick={() => {
            play(me.id, selectedCards);
            setSelectedCards([]);
          }}
        >
          出牌
        </button>
      </div>
    );
  }

  // 游戏结束
  if (stage === DoudizhuStage.FINISHED) {
    const isLandlord = me.id === landlordId;
    const landlordCampWon = winnerId === landlordId;
    const myCampWon = isLandlord === landlordCampWon;

    return (
      <div className="controls">
        <div className="result">
          {myCampWon ? '胜利' : '失败'} — {landlordCampWon ? '地主' : '农民'} 获胜
        </div>
        <button onClick={startGame}>再来一局</button>
      </div>
    );
  }

  // 其他情况（不是我的回合）
  return <div className="controls"><span>等待其他玩家...</span></div>;
}