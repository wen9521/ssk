// frontend/src/gameLogic/levels.js

// These are fallback levels for offline use.
// The coordinates are based on a 1024x1024 image size.

export const localLevels = [
    {
        id: 'local_level_1',
        original: '/images/image1.png',
        modified: '/images/image2.png',
        // Note: The differences for this pair of images need to be identified.
        // I will add some placeholder differences. 
        // A proper implementation would require a tool to find these coordinates.
        differences: [
            { "x": 512, "y": 512, "radius": 50 },
            { "x": 200, "y": 300, "radius": 40 },
            { "x": 800, "y": 700, "radius": 60 }
        ]
    },
    // We can add more local levels here if we have more image pairs.
    {
        id: 'local_level_2',
        original: '/images/image2.png', // Using the same images for demonstration
        modified: '/images/image1.png',
        differences: [
            { "x": 100, "y": 800, "radius": 55 },
            { "x": 900, "y": 150, "radius": 45 },
        ]
    }
];
