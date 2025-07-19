const soundMap = {
    // General Sounds
    'playCard': '/assets/sounds/fapai.mp3',
    'pass': '/assets/sounds/woman_bu_jiao.ogg',
    'selectCard': '/assets/sounds/fapai1.mp3',
    'gameStart': '/assets/sounds/start.mp3',
    
    // Dou Dizhu Sounds
    'doudizhu-bgMusic': '/assets/sounds/bg.mp3',
    'doudizhu-win': '/assets/sounds/start_a.ogg',
    'doudizhu-lose': '/assets/sounds/woman_bu_jiao.ogg',
    'bid1': '/assets/sounds/woman_jiao_di_zhu.ogg',
    'bid2': '/assets/sounds/woman_jiao_di_zhu.ogg',
    'bid3': '/assets/sounds/woman_jiao_di_zhu.ogg',
    'trio': '/assets/sounds/man_san_dai_yi_dui.ogg',
    'trio_single': '/assets/sounds/man_san_dai_yi_dui.ogg',
    'trio_pair': '/assets/sounds/man_san_dai_yi_dui.ogg',
    'straight': '/assets/sounds/shunzi.mp3',
    'pair': '/assets/sounds/duizi.mp3',
    'bomb': '/assets/sounds/zhadan.mp3',
    'rocket': '/assets/sounds/wangzha.mp3',
    'airplane': '/assets/sounds/feiji.mp3',

    // Thirteen Water Sounds
    'thirteen-water-bgMusic': '/assets/sounds/thirteen-water/background.mp3',
    'thirteen-water-start': '/assets/sounds/thirteen-water/game-start.mp3',
    'thirteen-water-deal': '/assets/sounds/thirteen-water/deal-cards.mp3',
    'thirteen-water-set': '/assets/sounds/thirteen-water/set-cards.mp3',
    'thirteen-water-compare': '/assets/sounds/thirteen-water/compare.mp3',
    'thirteen-water-win': '/assets/sounds/thirteen-water/win.mp3',
    'thirteen-water-lose': '/assets/sounds/thirteen-water/lose.mp3',
    'thirteen-water-gunshot': '/assets/sounds/thirteen-water/gunshot.mp3',
};

const audioCache = {};

function loadSound(name, src) {
    return new Promise((resolve) => {
        if (audioCache[name]) {
            return resolve(audioCache[name]);
        }
        const sound = new Audio(src);
        sound.oncanplaythrough = () => {
            audioCache[name] = sound;
            resolve(sound);
        };
        sound.onerror = () => {
            console.warn(`Warning: Sound file not found or failed to load: ${src}. The sound for '${name}' will not be played.`);
            resolve(null); // Resolve with null on error
        };
        // Timeout to prevent getting stuck
        setTimeout(() => resolve(sound), 3000);
    });
}

export async function preloadSounds() {
    const promises = Object.entries(soundMap).map(([name, src]) => loadSound(name, src));
    await Promise.all(promises);
    console.log("All designated sounds have been preloaded or attempted.");
}

export function playSound(name, { loop = false, volume = 1.0 } = {}) {
    const sound = audioCache[name];
    if (sound) {
        sound.currentTime = 0;
        sound.loop = loop;
        sound.volume = volume;
        sound.play().catch(err => console.error(`Error playing sound '${name}':`, err));
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
