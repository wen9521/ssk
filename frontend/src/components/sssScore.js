// frontend/src/components/sssScore.js
import React from 'react';
import Card from './Card';
import './styles/SssScore.css'; // We'll create this CSS file for styling

const SssScore = ({ players, onRestart }) => {

    const renderArrangement = (arrangement) => {
        if (!arrangement) return null;
        return (
            <div className="arrangement-display">
                <div className="dun-row"><strong>前墩:</strong> {arrangement.front.map(c => <Card key={c} cardName={c} isSmall={true} />)}</div>
                <div className="dun-row"><strong>中墩:</strong> {arrangement.middle.map(c => <Card key={c} cardName={c} isSmall={true} />)}</div>
                <div className="dun-row"><strong>后墩:</strong> {arrangement.back.map(c => <Card key={c} cardName={c} isSmall={true} />)}</div>
            </div>
        );
    };

    return (
        <div className="sss-score-overlay">
            <div className="sss-score-modal glass-card">
                <h1>比牌结果</h1>
                <div className="score-board">
                    {players.map(player => (
                        <div key={player.id} className="player-score-card">
                            <div className="player-header">
                                <h3>{player.name}</h3>
                                {player.isFoul && <span className="foul-tag">相公</span>}
                                <p className={`score ${player.score > 0 ? 'positive' : (player.score < 0 ? 'negative' : '')}`}>
                                    {player.score > 0 ? `+${player.score}` : player.score}
                                </p>
                            </div>
                            {renderArrangement(player.arrangement)}
                        </div>
                    ))}
                </div>
                <button onClick={onRestart} className="restart-button">再玩一局</button>
            </div>
        </div>
    );
};

export default SssScore;
