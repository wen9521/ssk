import React from 'react';
import Card from './Card';

export default function Hand({ hand }) {
  if (!hand) return null;
  return (
    <div>
      {hand.map(card => <Card key={card} card={card} />)}
    </div>
  );
}
