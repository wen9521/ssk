import React, { useState, useEffect } from 'react';
import Hand from './Hand.jsx';
import { createDeck, shuffleDeck, dealCards } from '../game-logic/deck';
import { calculateScore, simpleAI, isThreeOfAKind, isPair, isFullHouse, isFourOfAKind, isFlush, isStraight, isStraightFlush, isTwoPair } from '../game-logic/thirteen-water-rules';

const NUM_PLAYERS = 4; // 你+3个AI

function getHandType(hand) {
  if (hand.length === 3) {
    if (isThreeOfAKind(hand)) return '三条';
    if (isPair(hand)) return '对子';
    return '散牌';
  }
  if (hand.length === 5) {
    if (isStraightFlush(hand)) return '同花顺';
    if (isFourOfAKind(hand)) return '四条';
    if (isFullHouse(hand)) return '葫芦';
    if (isFlush(hand)) return '同花';
    if (isStraight(hand)) return '顺子';
    if (isTwoPair(hand)) return '两对';
    if (isThreeOfAKind(hand)) return '三条';
    if (isPair(hand)) return '对子';
    return '散牌';
  }
  return '';
}

function GameBoard() {
  const [playerCards, setPlayerCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [frontHand, setFrontHand] = useState([]);
  const [middleHand, setMiddleHand] = useState([]);
  const [backHand, setBackHand] = useState([]);
  const [aiHands, setAiHands] = useState([]); // [{front, middle, back}]
  const [gameResult, setGameResult] = useState(null);

  useEffect(() => {
    startNewGame();
    // eslint-disable-next-line
  }, []);

  function startNewGame() {
    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);
    const hands = dealCards(shuffledDeck, NUM_PLAYERS, 13);

    setPlayerCards(hands[0]);
    setSelectedCards([]);
    setFrontHand([]);
    setMiddleHand([]);
    setBackHand([]);
    setGameResult(null);
    // 生成所有AI手牌分配
    const ai = [];
    for (let i = 1; i < NUM_PLAYERS; ++i) {
      ai.push(simpleAI(hands[i]));
    }
    setAiHands(ai);
  }

  function handleCardClick(card) {
    const isSelected = selectedCards.some(selectedCard =>
      selectedCard.suit === card.suit && selectedCard.rank === card.rank
    );
    if (isSelected) {
      setSelectedCards(selectedCards.filter(selectedCard =>
        !(selectedCard.suit === card.suit && selectedCard.rank === card.rank)
      ));
    } else {
      if (selectedCards.length < playerCards.length) {
        setSelectedCards([...selectedCards, card]);
      }
    }
  }

  function assignToHand(handType) {
    if (handType === 'front') {
      if (selectedCards.length === 0 || frontHand.length + selectedCards.length > 3) {
        alert('请选择正确数量的牌分配到前墩 (3张)');
        return;
      }
    } else if (handType === 'middle' || handType === 'back') {
      if (selectedCards.length === 0 ||
        (handType === 'middle' && middleHand.length + selectedCards.length > 5) ||
        (handType === 'back' && backHand.length + selectedCards.length > 5)) {
        alert('请选择正确数量的牌分配到中墩或后墩 (5张)');
        return;
      }
    }
    const allAssignedCards = [...frontHand, ...middleHand, ...backHand];
    const alreadyAssigned = selectedCards.some(selectedCard =>
      allAssignedCards.some(assignedCard =>
        assignedCard.suit === selectedCard.suit && assignedCard.rank === selectedCard.rank
      )
    );
    if (alreadyAssigned) {
      alert('选中的牌已经分配过了');
      return;
    }
    if (handType === 'front') setFrontHand([...frontHand, ...selectedCards]);
    else if (handType === 'middle') setMiddleHand([...middleHand, ...selectedCards]);
    else if (handType === 'back') setBackHand([...backHand, ...selectedCards]);

    setPlayerCards(playerCards.filter(card =>
      !selectedCards.some(selectedCard =>
        selectedCard.suit === card.suit && selectedCard.rank === card.rank
      )
    ));
    setSelectedCards([]);
  }

  function removeFromHand(handType, cardToRemove) {
    if (handType === 'front') {
      setFrontHand(frontHand.filter(card => !(card.suit === cardToRemove.suit && card.rank === cardToRemove.rank)));
      setPlayerCards([...playerCards, cardToRemove]);
    } else if (handType === 'middle') {
      setMiddleHand(middleHand.filter(card => !(card.suit === cardToRemove.suit && card.rank === cardToRemove.rank)));
      setPlayerCards([...playerCards, cardToRemove]);
    } else if (handType === 'back') {
      setBackHand(backHand.filter(card => !(card.suit === cardToRemove.suit && card.rank === cardToRemove.rank)));
      setPlayerCards([...playerCards, cardToRemove]);
    }
  }

  function handleCompareHands() {
    if (frontHand.length !== 3 || middleHand.length !== 5 || backHand.length !== 5) {
      alert('请先将所有牌分到前、中、后三墩');
      return;
    }
    // 逐个和AI比，统计总得分
    let myScore = 0;
    const details = [];
    aiHands.forEach((ai, idx) => {
      const score = calculateScore(
        { front: frontHand, middle: middleHand, back: backHand },
        ai
      );
      myScore += score;
      details.push({ aiIndex: idx + 1, score });
    });
    setGameResult({ myScore, details });
  }

  // 牌型提示
  const frontType = getHandType(frontHand);
  const middleType = getHandType(middleHand);
  const backType = getHandType(backHand);

  return (
    <div className="play-container">
      <h2>游戏区域（4人）</h2>
      <button onClick={startNewGame}>开始新游戏</button>

      <div className="cards-area">
        <h3>我的手牌 ({playerCards.length} 张)</h3>
        <Hand cards={playerCards} onCardClick={handleCardClick} selectedCards={selectedCards} />
      </div>

      <div className="hand-assignments">
        <div className="play-pai-dun">
          <h4>前墩 ({frontHand.length}/3) <span style={{ color: '#ffb14d', fontSize: 13 }}>{frontType}</span></h4>
          <Hand cards={frontHand} />
          {frontHand.map((card, index) => (
            <button key={index} onClick={() => removeFromHand('front', card)}>移除 {card.rank} {card.suit}</button>
          ))}
          <button onClick={() => assignToHand('front')}>分配到前墩</button>
        </div>
        <div className="play-pai-dun">
          <h4>中墩 ({middleHand.length}/5) <span style={{ color: '#ffb14d', fontSize: 13 }}>{middleType}</span></h4>
          <Hand cards={middleHand} />
          {middleHand.map((card, index) => (
            <button key={index} onClick={() => removeFromHand('middle', card)}>移除 {card.rank} {card.suit}</button>
          ))}
          <button onClick={() => assignToHand('middle')}>分配到中墩</button>
        </div>
        <div className="play-pai-dun">
          <h4>后墩 ({backHand.length}/5) <span style={{ color: '#ffb14d', fontSize: 13 }}>{backType}</span></h4>
          <Hand cards={backHand} />
          {backHand.map((card, index) => (
            <button key={index} onClick={() => removeFromHand('back', card)}>移除 {card.rank} {card.suit}</button>
          ))}
          <button onClick={() => assignToHand('back')}>分配到后墩</button>
        </div>
      </div>

      {frontHand.length === 3 && middleHand.length === 5 && backHand.length === 5 && aiHands.length > 0 && (
        <button onClick={handleCompareHands}>比牌并计分</button>
      )}

      {gameResult && (
        <div className="result-container">
          <h3>游戏结果</h3>
          <p>你的总分：<b style={{ color: gameResult.myScore > 0 ? '#23e67a' : (gameResult.myScore < 0 ? '#ff4444' : '#fff') }}>{gameResult.myScore}</b></p>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 15 }}>
            {gameResult.details.map(d => (
              <li key={d.aiIndex}>对手{d.aiIndex}：{d.score > 0 ? `你赢${d.score}分` : (d.score < 0 ? `你输${-d.score}分` : '平局')}</li>
            ))}
          </ul>
        </div>
      )}

      {aiHands.length > 0 && (
        <div className="opponent-hands">
          <h3>AI对手牌墩</h3>
          {aiHands.map((ai, idx) => (
            <div key={idx} className="play-pai-dun" style={{ marginBottom: 16, background: '#212' }}>
              <h4>对手{idx + 1}</h4>
              <div>
                <strong>前墩</strong> <span style={{ color: '#ffb14d', fontSize: 13 }}>{getHandType(ai.front)}</span>
                <Hand cards={ai.front} />
              </div>
              <div>
                <strong>中墩</strong> <span style={{ color: '#ffb14d', fontSize: 13 }}>{getHandType(ai.middle)}</span>
                <Hand cards={ai.middle} />
              </div>
              <div>
                <strong>后墩</strong> <span style={{ color: '#ffb14d', fontSize: 13 }}>{getHandType(ai.back)}</span>
                <Hand cards={ai.back} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GameBoard;
