// frontend/src/components/SpotTheDifference.js
import React, { useState, useRef, useEffect } from 'react';
import './styles/SpotTheDifference.css';
import { levels } from './gamedata/spotTheDifference';

const SpotTheDifference = () => {
    const [currentLevel, setCurrentLevel] = useState(0);
    const [foundDifferences, setFoundDifferences] = useState([]);
    const [isLevelComplete, setIsLevelComplete] = useState(false);
    const [isGameComplete, setIsGameComplete] = useState(false);

    const { original, modified, differences } = levels[currentLevel];

    useEffect(() => {
        if (foundDifferences.length === differences.length) {
            setIsLevelComplete(true);
            if (currentLevel === levels.length - 1) {
                setIsGameComplete(true);
            }
        }
    }, [foundDifferences, differences, currentLevel]);

    const handleImageClick = (e) => {
        if (isLevelComplete) return;

        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        differences.forEach((diff, index) => {
            const distance = Math.sqrt(Math.pow(x - diff.x, 2) + Math.pow(y - diff.y, 2));
            if (distance < diff.radius) {
                if (!foundDifferences.includes(index)) {
                    setFoundDifferences([...foundDifferences, index]);
                }
            }
        });
    };

    const handleNextLevel = () => {
        if (currentLevel < levels.length - 1) {
            setCurrentLevel(currentLevel + 1);
            setFoundDifferences([]);
            setIsLevelComplete(false);
        }
    };

    const handlePreviousLevel = () => {
        if (currentLevel > 0) {
            setCurrentLevel(currentLevel - 1);
            setFoundDifferences([]);
            setIsLevelComplete(false);
            setIsGameComplete(false);
        }
    };

    const handleRestartGame = () => {
        setCurrentLevel(0);
        setFoundDifferences([]);
        setIsLevelComplete(false);
        setIsGameComplete(false);
    };

    return (
        <div className="spot-the-difference-container">
            <h1>大家来找茬 - 第 {currentLevel + 1} 关</h1>
            <div className="images-container">
                <div className="image-wrapper" onClick={handleImageClick}>
                    <img src={original} alt="Original" />
                    {foundDifferences.map(index => (
                        <div
                            key={index}
                            className="difference-marker"
                            style={{ left: differences[index].x - differences[index].radius, top: differences[index].y - differences[index].radius, width: differences[index].radius * 2, height: differences[index].radius * 2 }}
                        />
                    ))}
                </div>
                <div className="image-wrapper" onClick={handleImageClick}>
                    <img src={modified} alt="Modified" />
                    {foundDifferences.map(index => (
                        <div
                            key={index}
                            className="difference-marker"
                            style={{ left: differences[index].x - differences[index].radius, top: differences[index].y - differences[index].radius, width: differences[index].radius * 2, height: differences[index].radius * 2 }}
                        />
                    ))}
                </div>
            </div>

            {isGameComplete ? (
                <div className="game-complete-message">
                    <h2>恭喜你，通关啦！</h2>
                    <button onClick={handleRestartGame}>重新开始</button>
                </div>
            ) : (
                <>
                    <p>找到的差异点: {foundDifferences.length} / {differences.length}</p>
                    {isLevelComplete && (
                        <div className="level-complete-message">
                            <h3>恭喜你，完成本关！</h3>
                            <button onClick={handleNextLevel}>下一关</button>
                        </div>
                    )}
                    <div className="level-controls">
                        <button onClick={handlePreviousLevel} disabled={currentLevel === 0}>上一关</button>
                        <button onClick={handleNextLevel} disabled={currentLevel === levels.length - 1 || !isLevelComplete}>
                            {isLevelComplete ? '下一关' : '完成本关以解锁'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default SpotTheDifference;
