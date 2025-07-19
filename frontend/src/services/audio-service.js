const soundMap = {
    // General Sounds
    'playCard': '/assets/sounds/fapai.mp3',
    'pass': '/assets/sounds/woman_bu_jiao.ogg',
    'selectCard': '/assets/sounds/fapai1.mp3',
    'bgMusic': '/assets/sounds/bg.mp3',
    'gameStart': '/assets/sounds/start.mp3',
    'win': '/assets/sounds/start_a.ogg', // Using a generic positive sound
    'lose': '/assets/sounds/woman_bu_jiao.ogg', // Using a generic negative sound

    // Bidding Sounds
    'bid1': '/assets/sounds/woman_jiao_di_zhu.ogg', // Generic "I bid"
    'bid2': '/assets/sounds/woman_jiao_di_zhu.ogg',
    'bid3': '/assets/sounds/woman_jiao_di_zhu.ogg', 

    // Card Type Sounds
    'trio': '/assets/sounds/man_san_dai_yi_dui.ogg', // Using "three with pair" for all trios
    'trio_single': '/assets/sounds/man_san_dai_yi_dui.ogg',
    'trio_pair': '/assets/sounds/man_san_dai_yi_dui.ogg',
    'straight': '/assets/sounds/shunzi.mp3', // Assuming you'll add shunzi.mp3
    'pair': '/assets/sounds/duizi.mp3',
    'bomb': '/assets/sounds/zhadan.mp3', // Assuming you'll add zhadan.mp3
    'rocket': '/assets/sounds/wangzha.mp3', // Assuming you'll add wangzha.mp3
    'airplane': '/assets/sounds/feiji.mp3', // Assuming you'll add feiji.mp3
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
            // Don't reject, just log the error so one missing sound doesn't break everything
            console.warn(`Error loading sound: ${name} from ${src}. It will not be played.`);
            resolve(null); // Resolve with null to indicate failure
        };
        // Some browsers might not fire 'oncanplaythrough' for all audio types consistently
        // We'll add a timeout to prevent getting stuck
        setTimeout(() => resolve(sound), 2000); 
    });
}

export async function preloadSounds() {
    const promises = Object.entries(soundMap).map(([name, src]) => loadSound(name, src));
    await Promise.all(promises);
    console.log("All sounds preloaded (or timed out).");
}

export function playSound(name, { loop = false, volume = 1.0 } = {}) {
    const sound = audioCache[name];
    if (sound) {
        sound.currentTime = 0;
        sound.loop = loop;
        sound.volume = volume;
        sound.play().catch(err => console.error(`Error playing sound: ${name}`, err));
    } else {
        // console.warn(`Sound not found or not loaded: ${name}`);
    }
}

export function stopSound(name) {
    const sound = audioCache[name];
    if (sound) {
        sound.pause();
        sound.currentTime = 0;
    }
}

// Preload sounds when the module is loaded
preloadSounds();
