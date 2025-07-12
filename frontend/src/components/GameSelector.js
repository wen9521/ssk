// frontend/src/components/GameSelector.js
import React from 'react';
import { useGame } from '../context/GameContext';
import './styles/GameSelector.css'; // 引入专属CSS

const games = [
    { id: 'thirteen_water', name: '十三水', status: '已上线' },
    { id: 'doudizhu', name: '斗地主', status: '已上线' },
    { id: 'big_two', name: '锄大地', status: '已上线' },
];

function GameSelector() {
    const { selectGameType } = useGame();

    return (
        <div className="selector-container">
            <h2>选择游戏</h2>
            {games.map(game => (
                <button
                    key={game.id}
                    className="game-button"
                    onClick={() => selectGameType(game.id)}
                    disabled={game.status !== '已上线'}
                >
                    {game.name}
                    <span className="game-status">{game.status}</span>
                </button>
            ))}
        </div>
    );
}

export default GameSelector;
