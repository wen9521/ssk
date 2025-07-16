// frontend/src/gameLogic/levels.js

// Cloudflare R2 public bucket URL
const R2_PUBLIC_URL = "https://pub-5a0d7fbdb4e94d9db5d2a074b6e346e4.r2.dev";

// Fallback levels using the correct R2 paths.
export const localLevels = [
    {
        id: 'r2_level_1',
        original: `${R2_PUBLIC_URL}/image1.png`,
        modified: `${R2_PUBLIC_URL}/image2.png`,
        differences: [
            { "x": 512, "y": 512, "radius": 50 },
            { "x": 200, "y": 300, "radius": 40 },
            { "x": 800, "y": 700, "radius": 60 }
        ]
    },
    {
        id: 'r2_level_2',
        original: `${R2_PUBLIC_URL}/image2.png`,
        modified: `${R2_PUBLIC_URL}/image1.png`,
        differences: [
            { "x": 100, "y": 800, "radius": 55 },
            { "x": 900, "y": 150, "radius": 45 },
        ]
    }
];
