const soundMap = {
    'playCard': '/assets/sounds/fapai.mp3',
    'pass': '/assets/sounds/woman_bu_jiao.ogg',
    'selectCard': '/assets/sounds/fapai1.mp3',
    'bgMusic': '/assets/sounds/bg.mp3',
};

const audioCache = {};

function loadSound(name, src) {
    return new Promise((resolve, reject) => {
        if (audioCache[name]) {
            return resolve(audioCache[name]);
        }
        const sound = new Audio(src);
        sound.oncanplaythrough = () => {
            audioCache[name] = sound;
            resolve(sound);
        };
        sound.onerror = (err) => {
            console.error(`Error loading sound: ${name}`, err);
            reject(err);
        };
    });
}

export async function preloadSounds() {
    for (const [name, src] of Object.entries(soundMap)) {
        await loadSound(name, src);
    }
}

export function playSound(name, { loop = false, volume = 1.0 } = {}) {
    const sound = audioCache[name];
    if (sound) {
        sound.currentTime = 0;
        sound.loop = loop;
        sound.volume = volume;
        sound.play().catch(err => console.error(`Error playing sound: ${name}`, err));
    } else {
        console.warn(`Sound not found or not loaded: ${name}`);
    }
}

export function stopSound(name) {
    const sound = audioCache[name];
    if (sound) {
        sound.pause();
        sound.currentTime = 0;
    }
}

// Preload sounds on module load
preloadSounds();
