export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
export let masterVolume = 1;

export function setMasterVolume(v) {
    masterVolume = Math.max(0, Math.min(1, v));
}

export function playBeep(freq = 440, duration = 0.1, volume = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = volume * masterVolume;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

export function startBackgroundMusic() {
    const notes = [261.63, 329.63, 392.0, 523.25];
    let idx = 0;
    setInterval(() => {
        const freq = notes[idx % notes.length];
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.05 * masterVolume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001 * masterVolume, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
        idx++;
    }, 400);
}
