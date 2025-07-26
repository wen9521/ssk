import React, { useEffect } from 'react';
import { useDoudizhuStore } from '../../store/doudizhuStore'; // Store的导入保持不变
import { DoudizhuStage } from '../../game-logic'; // Stage枚举的导入保持不变
import DoudizhuPlay from './DoudizhuPlay';
import Hand from '../common/Hand'; // 引入我们通用的手牌组件
import { decideBid, decidePlay } from '../../game-logic/doudizhu.ai';
import './Doudizhu.css';

export default function DoudizhuBoard() {
  // 解构现在可以直接从Store的顶层获取状态，不再需要.game
  const {
    stage, players, landlordId, landlordCards,
    currentPlayerId, currentHandOnTable, lastPlayerId,
    biddingState, winnerId,
    startGame, bid, passBid, play, pass
  } = useDoudizhuStore();

  useEffect(() => {
    // 初始加载时开始游戏
    if (stage === DoudizhuStage.IDLE) {
        startGame();
    }
  }, [startGame, stage]);

  // AI自动操作的useEffect保持不变，因为依赖的状态现在能正确获取了
  useEffect(() => {
    const curPlayer = players.find(p => p.id === currentPlayerId);
    if (!curPlayer || !curPlayer.isAI || stage === DoudizhuStage.FINISHED) return;

    const aiActionTimeout = setTimeout(() => {
      if (stage === DoudizhuStage.BIDDING) {
        const score = decideBid(curPlayer.hand, biddingState.highestBid);
        if (score > 0) {
          bid(curPlayer.id, score);
        } else {
          passBid(curPlayer.id);
        }
      } else if (stage === DoudizhuStage.PLAYING) {
        const cardsToPlay = decidePlay(curPlayer.hand, currentHandOnTable);
        if (cardsToPlay && cardsToPlay.length > 0) {
          play(curPlayer.id, cardsToPlay);
        } else {
          pass(curPlayer.id);
        }
      }
    }, 1000); // 增加一点延迟，让玩家能看清AI操作

    return () => clearTimeout(aiActionTimeout);
  }, [currentPlayerId, stage, players, biddingState, currentHandOnTable, bid, passBid, play, pass]);

  const me = players.find(p => !p.isAI) || players[0];

  return (
    <div className="ddz-board">
      <header className="ddz-header">
        <button onClick={startGame}>重新开始</button>
        <div className="landlord-cards">
          地主牌:
          {/* 修复了JSX错误，并使用更稳定的key */}
          {landlordCards.map((c, i) => (
            // 假设Card组件可以显示牌背或牌面
            <span key={`${c.rank}-${c.suit}-${i}`} className="card-symbol">
                {stage === DoudizhuStage.PLAYING ? c.rank : '?'}
            </span>
          ))}
        </div>
        <div/>
      </header>

      <main className="ddz-main">
        {players.map((p, idx) => (
          // 假设玩家座位布局是固定的，0是自己，1是右边，2是左边
          <div
            key={p.id}
            // 动态计算座位，假设'player-0'是底部，'player-1'是右边，'player-2'是左边
            className={`seat seat-${(p.id.split('-')[1] - me.id.split('-')[1] + 3) % 3} ${p.id === currentPlayerId ? 'active' : ''}`}
          >
            <div className="seat-info">
              <span>{p.name}</span>
              {p.id === landlordId && <span className="tag">地主</span>}
            </div>
            <div className="seat-cards-count">
              {/* 不显示AI的手牌，只显示数量 */}
              <span>剩余: {p.hand.length}</span>
            </div>
            {/* 可以在这里显示上一次出的牌 */}
          </div>
        ))}
        <div className="table-center">
            {/* 显示当前桌上的牌 */}
        </div>
      </main>
      
      <footer className="ddz-footer">
        {/* 玩家手牌区域 */}
        {me && <Hand cards={me.hand} /* Hand组件需要的其他props */ />}

        {/* 操作区域 */}
        <DoudizhuPlay
          me={me}
          stage={stage}
          biddingState={biddingState}
          currentPlayerId={currentPlayerId} // 传入currentPlayerId
          currentHandOnTable={currentHandOnTable}
          lastPlayerId={lastPlayerId}
          winnerId={winnerId}
          landlordId={landlordId}
          // Actions: play, pass, bid, passBid, startGame 已经从 DoudizhuPlay 组件内部获取
        />
      </footer>
    </div>
  );
}