import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiSmartSplit, getPlayerSmartSplits } from '../game-logic/thirteen-water-rules';
import { calcSSSAllScores, isFoul } from '../game-logic/thirteen-water-rules';
import { getShuffledDeck, dealHands } from '../game-logic/deck';
import GameBoard from './GameBoard';
import './Play.css';

const AI_NAMES = ['小明', '小红', '小刚'];

export default function Play() {
  const navigate = useNavigate();
  const [head, setHead] = useState([]);
  const [middle, setMiddle] = useState([]);
  const [tail, setTail] = useState([]);
  const [selected, setSelected] = useState({ area: '', cards: [] });
  const [msg, setMsg] = useState('');
  const [aiPlayers, setAiPlayers] = useState([
    { name: AI_NAMES[0], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
    { name: AI_NAMES[1], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
    { name: AI_NAMES[2], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
  ]);
  const [showResult, setShowResult] = useState(false);
  const [scores, setScores] = useState([0,0,0,0]);
  const [isReady, setIsReady] = useState(false);
  const [hasCompared, setHasCompared] = useState(false);
  const [foulStates, setFoulStates] = useState([false, false, false, false]);
  const [mySplits, setMySplits] = useState([]);
  const [splitIndex, setSplitIndex] = useState(0);
  const [aiProcessed, setAiProcessed] = useState([false, false, false]);

  function handleReady() {
    if (!isReady) {
      const deck = getShuffledDeck();
      const [myHand, ...aiHands] = dealHands(deck);
      setHead(myHand.slice(0, 3));
      setMiddle(myHand.slice(3, 8));
      setTail(myHand.slice(8, 13));
      setIsReady(true);
      setHasCompared(false);
      setMsg('');
      setShowResult(false);
      setScores([0,0,0,0]);
      setSelected({ area: '', cards: [] });
      setFoulStates([false, false, false, false]);
      setMySplits([]); setSplitIndex(0);
      setAiProcessed([false, false, false]);
      setAiPlayers([
        { name: AI_NAMES[0], isAI: true, cards13: aiHands[0], head: aiHands[0].slice(0,3), middle: aiHands[0].slice(3,8), tail: aiHands[0].slice(8,13), processed: false },
        { name: AI_NAMES[1], isAI: true, cards13: aiHands[1], head: aiHands[1].slice(0,3), middle: aiHands[1].slice(3,8), tail: aiHands[1].slice(8,13), processed: false },
        { name: AI_NAMES[2], isAI: true, cards13: aiHands[2], head: aiHands[2].slice(0,3), middle: aiHands[2].slice(3,8), tail: aiHands[2].slice(8,13), processed: false },
      ]);
      setTimeout(() => {
        const splits = getPlayerSmartSplits(myHand);
        setMySplits(splits);
        setSplitIndex(0);
      }, 0);
      aiHands.forEach((hand, idx) => {
        setTimeout(() => {
          setAiPlayers(old => {
            const newAis = [...old];
            const split = aiSmartSplit(hand);
            newAis[idx] = { ...newAis[idx], ...split, processed: true };
            return newAis;
          });
          setAiProcessed(proc => {
            const arr = [...proc];
            arr[idx] = true;
            return arr;
          });
        }, 400 + idx * 350);
      });
    } else {
      setHead([]); setMiddle([]); setTail([]);
      setAiPlayers([
        { name: AI_NAMES[0], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
        { name: AI_NAMES[1], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
        { name: AI_NAMES[2], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
      ]);
      setIsReady(false);
      setHasCompared(false);
      setMsg('');
      setShowResult(false);
      setScores([0,0,0,0]);
      setSelected({ area: '', cards: [] });
      setFoulStates([false, false, false, false]);
      setMySplits([]); setSplitIndex(0);
      setAiProcessed([false, false, false]);
    }
  }

  function handleCardClick(card, area, e) {
    e.stopPropagation();
    setSelected(prev => {
      if (prev.area !== area) return { area, cards: [card] };
      const isSelected = prev.cards.includes(card);
      let nextCards;
      if (isSelected) {
        nextCards = prev.cards.filter(c => c !== card);
      } else {
        nextCards = [...prev.cards, card];
      }
      return { area, cards: nextCards };
    });
  }

  function moveTo(dest) {
    if (!selected.cards.length) return;
    let newHead = [...head], newMiddle = [...middle], newTail = [...tail];
    const from = selected.area;
    if (from === 'head') newHead = newHead.filter(c => !selected.cards.includes(c));
    if (from === 'middle') newMiddle = newMiddle.filter(c => !selected.cards.includes(c));
    if (from === 'tail') newTail = newTail.filter(c => !selected.cards.includes(c));
    if (dest === 'head') newHead = [...newHead, ...selected.cards];
    if (dest === 'middle') newMiddle = [...newMiddle, ...selected.cards];
    if (dest === 'tail') newTail = [...newTail, ...selected.cards];
    setHead(newHead); setMiddle(newMiddle); setTail(newTail);
    setSelected({ area: dest, cards: [] });
    setMsg('');
  }

  function handleSmartSplit() {
    if (!mySplits.length) {
      setMsg('智能分牌计算中，请稍候…');
      return;
    }
    const nextIdx = (splitIndex + 1) % mySplits.length;
    setSplitIndex(nextIdx);
    const split = mySplits[nextIdx];
    setHead(split.head);
    setMiddle(split.middle);
    setTail(split.tail);
    setMsg(`已切换智能分牌方案 ${nextIdx + 1}/${mySplits.length}`);
  }

  function handleStartCompare() {
    if (aiProcessed.some(p => !p)) {
      setMsg('请等待所有玩家提交理牌');
      return;
    }
    if (head.length !== 3 || middle.length !== 5 || tail.length !== 5) {
      setMsg('请按 3-5-5 张分配');
      return;
    }
    const allPlayers = [
      { name: '你', head, middle, tail },
      ...aiPlayers.map(ai => ({ name: ai.name, head: ai.head, middle: ai.middle, tail: ai.tail }))
    ];
    const resScores = calcSSSAllScores(allPlayers);
    const fouls = allPlayers.map(p => isFoul(p.head, p.middle, p.tail));
    setScores(resScores);
    setFoulStates(fouls);
    setShowResult(true);
    setHasCompared(true);
    setMsg('');
    setIsReady(false);
  }

  return (
    <div>
        <GameBoard
          head={head}
          middle={middle}
          tail={tail}
          selected={selected}
          msg={msg}
          aiPlayers={aiPlayers}
          showResult={showResult}
          scores={scores}
          isReady={isReady}
          hasCompared={hasCompared}
          foulStates={foulStates}
          aiProcessed={aiProcessed}
          handleReady={handleReady}
          handleCardClick={handleCardClick}
          moveTo={moveTo}
          handleSmartSplit={handleSmartSplit}
          handleStartCompare={handleStartCompare}
          setShowResult={setShowResult}
        />
        <button className="btn btn-back" onClick={() => navigate(-1)} style={{marginTop: '20px'}}>返回菜单</button>
    </div>
  );
}

export { isFoul } from '../game-logic/thirteen-water-rules';
