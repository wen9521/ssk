// frontend/src/components/SpotTheDifference.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/SpotTheDifference.css';
import { localLevels } from '../gameLogic/levels'; 

// --- Components ---
const GameStateDisplay = ({ message, isLoading = false, onRetry }) => (
    <div className="game-state-container">
        {isLoading && <div className="loader"></div>}
        <p>{message}</p>
        {onRetry && <button onClick={onRetry}>重试</button>}
    </div>
);

const DifferenceMarker = ({ diff, scaleFactor }) => {
    const style = {
        left: `${(diff.x / 1024) * 100}%`,
        top: `${(diff.y / 1024) * 100}%`,
        width: `${diff.radius * 2 * scaleFactor}px`,
        height: `${diff.radius * 2 * scaleFactor}px`,
        transform: 'translate(-50%, -50%)', // Center the marker on the coordinates
    };
    return <div className="difference-marker" style={style} />;
};

const GameImage = ({ src, onClick, children }) => {
    return (
        <div className="image-wrapper" onClick={onClick}>
            <img src={src} alt={src.includes('original') ? 'Original' : 'Modified'} crossOrigin="anonymous" />
            {children}
        </div>
    );
};


// --- Main Component ---
const SpotTheDifference = () => {
    const navigate = useNavigate();
    const [levels, setLevels] = useState([]);
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [foundDifferences, setFoundDifferences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageScaleFactor, setImageScaleFactor] = useState(1);

    const loadLevels = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Always use local levels and shuffle them
            const shuffledLevels = [...localLevels].sort(() => Math.random() - 0.5);
            setLevels(shuffledLevels);
        } catch (err) {
            setError('加载关卡失败，请刷新页面重试。');
        } finally {
            setIsLoading(false);
            setCurrentLevelIndex(0);
            setFoundDifferences([]);
        }
    }, []);

    useEffect(() => {
        loadLevels();
    }, [loadLevels]);

    const currentLevel = useMemo(() => levels[currentLevelIndex], [levels, currentLevelIndex]);
    const differences = useMemo(() => currentLevel?.differences || [], [currentLevel]);
    const isLevelComplete = useMemo(() => differences.length > 0 && foundDifferences.length === differences.length, [foundDifferences, differences]);
    const isGameComplete = useMemo(() => isLevelComplete && currentLevelIndex === levels.length - 1, [isLevelComplete, currentLevelIndex, levels.length]);

    const handleImageClick = useCallback((e) => {
        if (isLevelComplete || !currentLevel) return;

        const imgElement = e.currentTarget.querySelector('img');
        const rect = imgElement.getBoundingClientRect();
        
        // Calculate the scale of the displayed image relative to its natural size
        const scale = imgElement.clientWidth / imgElement.naturalWidth;
        setImageScaleFactor(scale);

        // Get click coordinates relative to the image's top-left corner
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        differences.forEach((diff, index) => {
            if (foundDifferences.includes(index)) return;
            const distance = Math.sqrt(Math.pow(x - diff.x, 2) + Math.pow(y - diff.y, 2));
            if (distance < diff.radius) {
                setFoundDifferences(prev => [...new Set([...prev, index])]); // Use Set to avoid duplicates
            }
        });
    }, [isLevelComplete, currentLevel, differences, foundDifferences]);
    
    const goToLevel = useCallback((index) => {
        if (index >= 0 && index < levels.length) {
            setCurrentLevelIndex(index);
            setFoundDifferences([]);
        }
    }, [levels.length]);

    const handleRestartGame = useCallback(() => {
        loadLevels();
    }, [loadLevels]);

    if (isLoading) return <GameStateDisplay message="正在加载关卡..." isLoading={true} />;
    if (error) return <GameStateDisplay message={error} onRetry={loadLevels} />;
    if (!currentLevel) return <GameStateDisplay message="恭喜！您已完成所有关卡！" />;

    return (
        <div className="spot-the-difference-container">
            <header className="game-header">
                <button className="back-button" onClick={() => navigate('/')}>&lt; 退出</button>
                <div className="game-info">
                    <h1>第 {currentLevelIndex + 1} / {levels.length} 关</h1>
                    <p>
                        找到的差异: {foundDifferences.length} / {differences.length}
                    </p>
                </div>
            </header>

            <main className="images-container">
                <GameImage src={currentLevel.original} onClick={handleImageClick}>
                    {foundDifferences.map(index => (
                        <DifferenceMarker key={index} diff={differences[index]} scaleFactor={imageScaleFactor} />
                    ))}
                </GameImage>
                <GameImage src={currentLevel.modified} onClick={handleImageClick}>
                    {foundDifferences.map(index => (
                        <DifferenceMarker key={index} diff={differences[index]} scaleFactor={imageScaleFactor} />
                    ))}
                </GameImage>
            </main>

            <footer className="game-footer">
                {isGameComplete ? (
                    <button className="game-button accent" onClick={handleRestartGame}>🎉 恭喜通关！再玩一次 🎉</button>
                ) : isLevelComplete ? (
                    <button className="game-button primary" onClick={() => goToLevel(currentLevelIndex + 1)}>✔️ 太棒了！下一关</button>
                ) : (
                    <div className="level-controls">
                        <button className="game-button" onClick={() => goToLevel(currentLevelIndex - 1)} disabled={currentLevelIndex === 0}>上一关</button>
                        <button className="game-button" onClick={() => goToLevel(currentLevelIndex + 1)} disabled={currentLevelIndex >= levels.length - 1}>下一关</button>
                    </div>
                )}
            </footer>
        </div>
    );
};

export default SpotTheDifference;
