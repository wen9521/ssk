jsx
import React, { useState } from 'react';
import Hand from './Hand';
import './Play.css';

export default function ArrangeArea({ hand, onSubmit }) {
  const [duns, setDuns] = useState([[], [], []]);
  const [selected, setSelected] = useState([]);

  const toggleSelect = (card) => {
    setSelected(sel => sel.includes(card) ?
      sel.filter(x => x !== card) :
      [...sel, card]
    );
  };

  const addToDun = (idx) => {
    if (!selected.length) return;
    setDuns(duns => duns.map((dun, i) =>
      i === idx ? [...dun, ...selected] : dun
    ));
    setSelected([]);
  };

  const removeFromDun = (dunIdx, card) => {
    setDuns(duns => duns.map((dun, i) =>
      i === dunIdx ? dun.filter(c => c !== card) : dun
    ));
  };

  const submit = () => {
    if (duns[0].length !== 3 || duns[1].length !== 5 || duns[2].length !== 5) {
      alert('头墩3张，中墩5张，尾墩5张');
      return;
    }
    onSubmit({ dun1: duns[0], dun2: duns[1], dun3: duns[2] });
  };

  const unallocated = hand.filter(card => !duns.flat().includes(card));

  return (
    <div className="arrange-area">
      <h3>请理牌</h3>

      <div className="unallocated-cards">
        <div className="section-label">未分配手牌 ({unallocated.length}/13)</div>
        <div className="cards-area">
          {unallocated.map(card => (
            <div
              key={card}
              className={`card-item ${selected.includes(card) ? 'selected' : ''}`}
              onClick={() => toggleSelect(card)}
            >
              <Hand hand={[card]} />
            </div>
          ))}
        </div>
      </div>

      <div className="dun-section">
        <div className="dun-header">
          <div className="dun-label">头墩 (3张)</div>
          <button onClick={() => addToDun(0)}>放入</button>
        </div>
        <div className="dun-cards">
          {duns[0].map(card => (
            <div
              key={card}
              className="card-item"
              onClick={() => removeFromDun(0, card)}
            >
              <Hand hand={[card]} />
            </div>
          ))}
        </div>
      </div>

      <div className="dun-section">
        <div className="dun-header">
          <div className="dun-label">中墩 (5张)</div>
          <button onClick={() => addToDun(1)}>放入</button>
        </div>
        <div className="dun-cards">
          {duns[1].map(card => (
            <div
              key={card}
              className="card-item"
              onClick={() => removeFromDun(1, card)}
            >
              <Hand hand={[card]} />
            </div>
          ))}
        </div>
      </div>

      <div className="dun-section">
        <div className="dun-header">
          <div className="dun-label">尾墩 (5张)</div>
          <button onClick={() => addToDun(2)}>放入</button>
        </div>
        <div className="dun-cards">
          {duns[2].map(card => (
            <div
              key={card}
              className="card-item"
              onClick={() => removeFromDun(2, card)}
            >
              <Hand hand={[card]} />
            </div>
          ))}
        </div>
      </div>

      <button
        className="submit-button"
        onClick={submit}
      >
        提交理牌结果
      </button>
    </div>
  );
}