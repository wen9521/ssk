
// frontend/src/components/SpotTheDifference.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/SpotTheDifference.css';

// The public URL for the R2 bucket where levels are stored.
// This should be your custom domain or the public R2.dev URL.
const LEVELS_JSON_URL = `https://render.wenxiuxiu.eu.org/render/levels.json`;

const GameStateDisplay = ({ message, isLoading = false, onRetry }) => (
    <div className="game-state-container">
        {isLoading && <div className="loader"></div>}
        <p>{message}</p>
        {onRetry && <button onClick={onRetry}>重试</button>}
    </div>
);

const DifferenceMarker = ({ diff, scaleFactor }) => {
    const style = {
        left: `${(diff.x / 1024) * 100}%`, // Assuming original images are 1024px wide for positioning
        top: `${(diff.y / 1024) * 100}%`,
        width: `${diff.radius * 2 * scaleFactor}px`,
        height: `${diff.radius * 2 * scaleFactor}px`,
        transform: 'translate(-50%, -50%)',
    };
    return <div className="difference-marker" style={style} />;
};

const GameImage = ({ src, onClick, children }) => {
    return (
        <div className="image-wrapper" onClick={onClick}>
            {/* Using a key helps React re-render the image when the src changes */}
            <img key={src} src={src} alt="Spot the difference" crossOrigin="anonymous" />
            {children}
        </div>
    );
};

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
            // Fetch levels from the remote R2 URL, adding a cache-busting parameter
            const response = await fetch(`${LEVELS_JSON_URL}?cachebust=${new Date().getTime()}`);
            if (!response.ok) {
                throw new Error(`无法加载在线关卡，请稍后重试 (状态: ${response.status})`);
            }
            const remoteLevels = await response.json();
            
            if (!Array.isArray(remoteLevels) || remoteLevels.length === 0) {
                throw new Error("在线关卡库为空，作者可能正在更新。");
            }
            // Shuffle levels for variety
            const shuffledLevels = [...remoteLevels].sort(() => Math.random() - 0.5);
            setLevels(shuffledLevels);

        } catch (err) {
            console.error("加载关卡失败:", err);
            setError(err.message);
            setLevels([]); // Clear levels on error
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
        if (!imgElement) return;
        const rect = imgElement.getBoundingClientRect();
        
        // Use naturalWidth for accurate scaling, fallback to 1024
        const scale = imgElement.clientWidth / (imgElement.naturalWidth || 1024);
        setImageScaleFactor(scale);

        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        differences.forEach((diff, index) => {
            if (foundDifferences.includes(index)) return;
            const distance = Math.sqrt(Math.pow(x - diff.x, 2) + Math.pow(y - diff.y, 2));
            if (distance < diff.radius) {
                setFoundDifferences(prev => [...new Set([...prev, index])]);
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

    if (isLoading) return <GameStateDisplay message="正在连接在线关卡库..." isLoading={true} />;
    if (error) return <GameStateDisplay message={error} onRetry={loadLevels} />;
    if (!currentLevel) return <GameStateDisplay message="未找到任何在线关卡。" onRetry={handleRestartGame} />;

    return (
        <div className="spot-the-difference-container">
            <header className="game-header">
                <button className="back-button" onClick={() => navigate('/')}>&lt; 退出</button>
                <div className="game-info">
                    <h1>{currentLevel.name} (关卡 {currentLevelIndex + 1} / {levels.length})</h1>
                    <p>找到的差异: {foundDifferences.length} / {differences.length}</p>
                </div>
            </header>

            <main className="images-container">
                <GameImage src={currentLevel.original} onClick={handleImageClick}>
                    {foundDifferences.map(index => (
                        <DifferenceMarker key={`${index}-original`} diff={differences[index]} scaleFactor={imageScaleFactor} />
                    ))}
                </GameImage>
                <GameImage src={currentLevel.modified} onClick={handleImageClick}>
                    {foundDifferences.map(index => (
                        <DifferenceMarker key={`${index}-modified`} diff={differences[index]} scaleFactor={imageScaleFactor} />
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
