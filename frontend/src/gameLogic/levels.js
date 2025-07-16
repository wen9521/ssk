// frontend/src/gameLogic/levels.js

// The public URL for your Cloudflare R2 bucket where levels are stored.
// This URL may require a proxy to access.
const R2_LEVELS_JSON_URL = "https://render.wenxiuxiu.eu.org/render/levels.json";

// Fallback levels in case the network request fails.
// These serve as a backup to ensure the game is always playable.
const fallbackLevels = [
    {
        id: 'fallback_level_1',
        name: "Fallback Level 1",
        original: `https://render.wenxiuxiu.eu.org/render/levels/adaa_original.png`,
        modified: `https://render.wenxiuxiu.eu.org/render/levels/adaa_modified.png`,
        differences: [
            { "type": "shape", "x": 512, "y": 512, "radius": 50 },
            { "type": "removal", "x": 200, "y": 300, "radius": 40 }
        ]
    }
];

/**
 * Asynchronously fetches the latest level data from the R2 bucket.
 * 
 * @returns {Promise<Array|null>} A promise that resolves to an array of level objects, or null if the fetch fails.
 */
const fetchLevels = async () => {
    try {
        const response = await fetch(R2_LEVELS_JSON_URL);
        if (!response.ok) {
            // If the response is not successful (e.g., 404 Not Found), throw an error.
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const levels = await response.json();
        console.log("Successfully fetched levels from R2:", levels);
        return levels;
    } catch (error) {
        // Log the error and return null to indicate failure.
        console.error("Failed to fetch levels from R2:", error);
        return null;
    }
};

/**
 * Gets the game levels, prioritizing fetching from the network and using fallbacks if necessary.
 * This is the main function that should be used by other parts of the application.
 *
 * @returns {Promise<Array>} A promise that resolves to an array of level objects.
 */
export const getLevels = async () => {
    const onlineLevels = await fetchLevels();
    if (onlineLevels && onlineLevels.length > 0) {
        // *** ROBUST FIX: Rebuild the URL from the filename to ensure correctness ***
        const correctedLevels = onlineLevels.map(level => {
            const baseUrl = 'https://render.wenxiuxiu.eu.org/render/levels/';
            
            // Extract the filename from the end of the provided URL path.
            const originalFilename = level.original.split('/').pop();
            const modifiedFilename = level.modified.split('/').pop();

            return {
                ...level,
                original: baseUrl + originalFilename,
                modified: baseUrl + modifiedFilename,
            };
        });
        console.log("Corrected online levels with robust URL builder:", correctedLevels);
        return correctedLevels;
    }
    // If fetching fails or returns no levels, use the local fallback data.
    console.warn("Using fallback levels.");
    return fallbackLevels;
};

// For backward compatibility or direct use, you can still export localLevels.
// Note: `getLevels` is the preferred way to get level data.
export const localLevels = fallbackLevels;
