import React, { useState } from 'react';
import Hand from './Hand';

export default function ArrangeArea({ hand, onSubmit }) {
  const [duns, setDuns] = useState([[], [], []]);
  const [selected, setSelected] = useState([]);

  // 选牌
  const toggleSelect = (card) => {
    setSelected(sel => sel.includes(card) ? sel.filter(x=>x!==card) : [...sel, card]);
  };

  // 将选中牌放入某墩
  const addToDun = (idx) => {
    if (!selected.length) return;
    setDuns(duns =>
      duns.map((dun, i) => i === idx ? [...dun, ...selected] : dun)
    );
    setSelected([]);
  };

  // 从某墩移除一张牌
  const removeFromDun = (dunIdx, card) => {
    setDuns(duns =>
      duns.map((dun, i) => i === dunIdx ? dun.filter(c=>c!==card) : dun)
    );
  };

  // 提交理牌
  const submit = () => {
    if (duns[0].length !== 3 || duns[1].length !== 5 || duns[2].length !== 5) {
      alert('头墩3张，中墩5张，尾墩5张');
      return;
    }
    onSubmit(duns);
  };

  // 未分配手牌
  const unallocated = hand.filter(card => !duns.flat().includes(card));

  return (
    <div>
      <div>
        <b>理牌区（点击牌选择，点击[放入]分配到对应墩）</b>
      </div>
      <div>
        <b>未分配手牌：</b>
        {unallocated.map(card => (
          <span
            key={card}
            style={{
              border: selected.includes(card) ? '2px solid blue' : '1px solid gray',
              margin: '2px',
              cursor: 'pointer',
              display: 'inline-block'
            }}
            onClick={()=>toggleSelect(card)}
          >
            <Hand hand={[card]} />
          </span>
        ))}
      </div>
      <div>
        <b>头墩(3)：</b>
        {duns[0].map(card => (
          <span key={card} onClick={()=>removeFromDun(0, card)} style={{cursor:'pointer'}} title="点击移除">
            <Hand hand={[card]}/>
          </span>
        ))}
        <button onClick={()=>addToDun(0)}>放入</button>
      </div>
      <div>
        <b>中墩(5)：</b>
        {duns[1].map(card => (
          <span key={card} onClick={()=>removeFromDun(1, card)} style={{cursor:'pointer'}} title="点击移除">
            <Hand hand={[card]}/>
          </span>
        ))}
        <button onClick={()=>addToDun(1)}>放入</button>
      </div>
      <div>
        <b>尾墩(5)：</b>
        {duns[2].map(card => (
          <span key={card} onClick={()=>removeFromDun(2, card)} style={{cursor:'pointer'}} title="点击移除">
            <Hand hand={[card]}/>
          </span>
        ))}
        <button onClick={()=>addToDun(2)}>放入</button>
      </div>
      <button onClick={submit}>提交理牌结果</button>
    </div>
  );
}
