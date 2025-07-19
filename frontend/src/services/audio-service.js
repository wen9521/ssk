const sounds = {};

export function playSound(name, { loop = false, volume = 1 } = {}) {
    let audio = sounds[name];
    if (!audio) {
        // 支持 mp3 或 wav 格式，根据你的资源实际调整
        audio = new Audio(`/assets/sounds/${name}.mp3`);
        sounds[name] = audio;
    }
    audio.loop = loop;
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play();
}

export function stopSound(name) {
    const audio = sounds[name];
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}
