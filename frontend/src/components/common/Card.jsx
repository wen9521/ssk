// frontend/src/components/common/Card.jsx
import React from 'react';
import { useDrag } from 'react-dnd';
import './Card.css';

const ItemTypes = {
  CARD: 'card',
};

const Card = ({ card, type = ItemTypes.CARD }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { card },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const cardStyle = {
    opacity: isDragging ? 0.5 : 1,
    backgroundImage: `url(/cards/${card.rank}_of_${card.suit}.svg)`, // Assuming SVG card images
  };

  return (
    <div ref={drag} className="card" style={cardStyle}>
      {/* Card content can be displayed here if not using background images */}
    </div>
  );
};

export default Card;
