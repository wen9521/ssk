const sounds = {};

// 维护一个音频文件到其路径的映射，避免运行时拼接错误
// 这需要手动维护，或者有一个构建步骤来生成这个映射
// 目前先根据已知文件来定义
const fullSoundMap = {
    // 斗地主音效 (来自 frontend/assets/sound/)
    'doudizhu-bg': '/assets/sound/bg.mp3',
    'doudizhu-duizi': '/assets/sound/duizi.mp3',
    'doudizhu-fapai': '/assets/sound/fapai.mp3',
    'doudizhu-fapai1': '/assets/sound/fapai1.mp3',
    'doudizhu-login_bg': '/assets/sound/login_bg.ogg', // 注意：ogg 格式
    'doudizhu-man_san_dai_yi_dui': '/assets/sound/man_san_dai_yi_dui.ogg',
    'doudizhu-start': '/assets/sound/start.mp3',
    'doudizhu-start_a': '/assets/sound/start_a.ogg',
    'doudizhu-woman_bu_jiao': '/assets/sound/woman_bu_jiao.ogg',
    'doudizhu-woman_jiao_di_zhu': '/assets/sound/woman_jiao_di_zhu.ogg',

    // 十三水音效 (来自 frontend/assets/sounds/thirteen-water/)
    'thirteen-water-background': '/assets/sounds/thirteen-water/background.mp3',
    'thirteen-water-compare': '/assets/sounds/thirteen-water/compare.mp3',
    'thirteen-water-deal-cards': '/assets/sounds/thirteen-water/deal-cards.mp3',
    'thirteen-water-game-start': '/assets/sounds/thirteen-water/game-start.mp3',
    'thirteen-water-gunshot': '/assets/sounds/thirteen-water/gunshot.mp3',
    'thirteen-water-lose': '/assets/sounds/thirteen-water/lose.mp3',
    'thirteen-water-set-cards': '/assets/sounds/thirteen-water/set-cards.mp3',
    'thirteen-water-win': '/assets/sounds/thirteen-water/win.mp3',
};

export function playSound(name, { loop = false, volume = 1, game = 'common' } = {}) {
    const cacheKey = `${game}-${name}`;
    let audio = sounds[cacheKey];

    if (!audio) {
        const path = fullSoundMap[cacheKey];
        if (!path) {
            console.warn(`Sound file not found in map for key: ${cacheKey}`);
            return;
        }
        try {
            audio = new Audio(path);
            sounds[cacheKey] = audio;
        } catch (e) {
            console.error(`Could not load sound from path: ${path}`, e);
            return;
        }
    }
    
    audio.loop = loop;
    audio.volume = volume;
    audio.currentTime = 0;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            // Autoplay policy was prevented. Mute or show a play button.
            console.warn(`Audio play failed for ${name} (${game}):`, error);
        });
    }
}

export function stopSound(name, { game = 'common' } = {}) {
    const cacheKey = `${game}-${name}`;
    const audio = sounds[cacheKey];
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}
