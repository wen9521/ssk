import React, { useState, useEffect } from 'react';
import Hand from './Hand.jsx';
import { createDeck, shuffleDeck, dealCards } from '../game-logic/deck';
import { calculateScore, simpleAI } from '../game-logic/thirteen-water-rules'; 
import '/frontend/src/App.css'; // 导入 CSS 文件
// 可能还需要其他组件，例如 PlayerArea, TableArea 等

function GameBoard() {
  const [playerCards, setPlayerCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [frontHand, setFrontHand] = useState([]);
  const [middleHand, setMiddleHand] = useState([]);
  const [backHand, setBackHand] = useState([]);
  const [opponentHands, setOpponentHands] = useState(null);
  const [gameResult, setGameResult] = useState(null);

  const numPlayers = 2; 
  const numCardsPerPlayer = 13; 

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);
    const hands = dealCards(shuffledDeck, numPlayers, numCardsPerPlayer);
    setPlayerCards(hands[0]); 
    setSelectedCards([]);
    setFrontHand([]);
    setMiddleHand([]);
    setBackHand([]);
    setGameResult(null);

    if (hands.length > 1) {
         const opponentCards = hands[1]; 
         const arrangedOpponentHands = simpleAI(opponentCards); 
         setOpponentHands(arrangedOpponentHands);
    }
  };

  const handleCardClick = (card) => {
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
  };

  const assignToHand = (handType) => {
    if (handType === 'front') {
        if (selectedCards.length === 0 || frontHand.length + selectedCards.length > 3) {
             alert('请选择正确数量的牌分配到前墩 (3张)');
             return;
        }
    } else if (handType === 'middle' || handType === 'back') {
         if (selectedCards.length === 0 || (handType === 'middle' && middleHand.length + selectedCards.length > 5) || (handType === 'back' && backHand.length + selectedCards.length > 5)) {
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

    if(alreadyAssigned) {
        alert('选中的牌已经分配过了');
        return;
    }

    if (handType === 'front') {
      setFrontHand([...frontHand, ...selectedCards]);
    } else if (handType === 'middle') {
      setMiddleHand([...middleHand, ...selectedCards]);
    } else if (handType === 'back') {
      setBackHand([...backHand, ...selectedCards]);
    }

    const remainingCards = playerCards.filter(card => 
        !selectedCards.some(selectedCard => 
            selectedCard.suit === card.suit && selectedCard.rank === card.rank
        )
    );
    setPlayerCards(remainingCards);

    setSelectedCards([]);
  };

   const removeFromHand = (handType, cardToRemove) => {
       if (handType === 'front') {
            const updatedHand = frontHand.filter(card => !(card.suit === cardToRemove.suit && card.rank === cardToRemove.rank));
            setFrontHand(updatedHand);
            setPlayerCards([...playerCards, cardToRemove]);
       } else if (handType === 'middle') {
             const updatedHand = middleHand.filter(card => !(card.suit === cardToRemove.suit && card.rank === cardToRemove.rank));
             setMiddleHand(updatedHand);
             setPlayerCards([...playerCards, cardToRemove]);
       } else if (handType === 'back') {
             const updatedHand = backHand.filter(card => !(card.suit === cardToRemove.suit && card.rank === cardToRemove.rank));
             setBackHand(updatedHand);
             setPlayerCards([...playerCards, cardToRemove]);
       }
   };


  const handleCompareHands = () => {
      if (frontHand.length !== 3 || middleHand.length !== 5 || backHand.length !== 5) {
          alert('请先将所有牌分到前、中、后三墩');
          return;
      }

      if (opponentHands) {
          const result = calculateScore({
              front: frontHand,
              middle: middleHand,
              back: backHand,
          }, opponentHands);
          setGameResult(result);
      }
  };

  return (
    <div className="play-container"> {/* 应用 play-container 样式 */}
      <h2>游戏区域</h2>
      <button onClick={startNewGame}>开始新游戏</button>

      <div className="cards-area"> {/* 应用 cards-area 样式 */}
        <h3>我的手牌 ({playerCards.length} 张)</h3>
        <Hand cards={playerCards} onCardClick={handleCardClick} selectedCards={selectedCards} />
      </div>

      <div className="hand-assignments"> {/* 可能需要为这个区域或其子元素添加样式 */}
        <div className="play-pai-dun"> {/* 应用 play-pai-dun 样式 */}
          <h4>前墩 ({frontHand.length}/3)</h4>
          <Hand cards={frontHand} />
            {frontHand.map((card, index) => (
                 <button key={index} onClick={() => removeFromHand('front', card)}>移除 {card.rank} {card.suit}</button>
            ))}
          <button onClick={() => assignToHand('front')}>分配到前墩</button>
        </div>
        <div className="play-pai-dun"> {/* 应用 play-pai-dun 样式 */}
          <h4>中墩 ({middleHand.length}/5)</h4>
          <Hand cards={middleHand} />
            {middleHand.map((card, index) => (
                 <button key={index} onClick={() => removeFromHand('middle', card)}>移除 {card.rank} {card.suit}</button>
            ))}
          <button onClick={() => assignToHand('middle')}>分配到中墩</button>
        </div>
        <div className="play-pai-dun"> {/* 应用 play-pai-dun 样式 */}
          <h4>后墩 ({backHand.length}/5)</h4>
          <Hand cards={backHand} />
             {backHand.map((card, index) => (
                 <button key={index} onClick={() => removeFromHand('back', card)}>移除 {card.rank} {card.suit}</button>
            ))}
          <button onClick={() => assignToHand('back')}>分配到后墩</button>
        </div>
      </div>

        {frontHand.length === 3 && middleHand.length === 5 && backHand.length === 5 && opponentHands && (
             <button onClick={handleCompareHands}>比牌并计分</button>
        )}

        {gameResult !== null && (
            <div className="result-container"> {/* 应用 result-container 样式 */}
                <h3>游戏结果</h3>
                {gameResult > 0 ? (
                    <p>恭喜！你赢了 {gameResult} 分！</p>
                ) : gameResult < 0 ? (
                    <p>遗憾！你输了 {-gameResult} 分！</p>
                ) : (
                    <p>平局！</p>
                )}
            </div>
        )}

        {opponentHands && (
             <div className="opponent-hands"> {/* 可能需要为对手区域添加样式 */}
                 <h3>对手的牌墩</h3>
                 <div className="play-pai-dun"> {/* 应用 play-pai-dun 样式 */}
                     <h4>前墩</h4>
                     <Hand cards={opponentHands.front} />
                 </div>
                 <div className="play-pai-dun"> {/* 应用 play-pai-dun 样式 */}
                     <h4>中墩</h4>
                     <Hand cards={opponentHands.middle} />
                 </div>
                 <div className="play-pai-dun"> {/* 应用 play-pai-dun 样式 */}
                     <h4>后墩</h4>
                     <Hand cards={opponentHands.back} />
                 </div>
             </div>
        )}

    </div>
  );
}

export default GameBoard;
