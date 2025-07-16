// frontend/src/gameLogic/levels.js

// The public URL for your Cloudflare R2 bucket where levels are stored.
const R2_LEVELS_JSON_URL = "https://render.wenxiuxiu.eu.org/render/levels.json";

// Fallback levels in case the network request fails.
const fallbackLevels = [
    {
        id: 'fallback_level_1',
        name: "Fallback Level 1",
        // The URLs here are now also built using the same logic for consistency
        original: `https://render.wenxiuxiu.eu.org/render/levels/fallback_level_1_original.png`,
        modified: `https://render.wenxiuxiu.eu.org/render/levels/fallback_level_1_modified.png`,
        differences: [
            { "type": "shape", "x": 512, "y": 512, "radius": 50 }
        ]
    }
];

/**
 * Asynchronously fetches the latest level data from the R2 bucket.
 */
const fetchLevels = async () => {
    try {
        const response = await fetch(R2_LEVELS_JSON_URL);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const levels = await response.json();
        console.log("Successfully fetched levels from R2:", levels);
        return levels;
    } catch (error) {
        console.error("Failed to fetch levels from R2:", error);
        return null;
    }
};

/**
 * Gets the game levels, constructing correct image URLs from the level ID.
 * This is the main function to be used by the application.
 */
export const getLevels = async () => {
    const onlineLevels = await fetchLevels();
    
    if (onlineLevels && Array.isArray(onlineLevels) && onlineLevels.length > 0) {
        // *** FINAL & CORRECT FIX: Construct image URLs directly from the level 'id' ***
        const correctedLevels = onlineLevels.map(level => {
            // Handle cases where a level might be missing an 'id'
            if (!level.id) {
                console.error("Level is missing an 'id', cannot construct image URLs:", level);
                // Return the level with empty image paths to avoid crashes and make debugging easier
                return { ...level, original: '', modified: '', name: '无效关卡 (缺少ID)' };
            }
            
            const baseUrl = 'https://render.wenxiuxiu.eu.org/render/levels/';
            const baseName = level.id;
            
            // As per your instruction, the only variable parts are the name (id) and extension.
            // We will assume '.png' as the extension unless specified otherwise.
            const extension = 'png';

            return {
                ...level,
                original: `${baseUrl}${baseName}_original.${extension}`,
                modified: `${baseUrl}${baseName}_modified.${extension}`,
            };
        });
        
        console.log("Final corrected levels built from ID:", correctedLevels);
        return correctedLevels;
    }
    
    // If fetching fails or returns no levels, use the local fallback data.
    console.warn("Using fallback levels.");
    return fallbackLevels;
};

// For backward compatibility
export const localLevels = fallbackLevels;
