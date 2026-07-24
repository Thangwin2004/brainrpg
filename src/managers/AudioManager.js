export class AudioManager {
    static init() {
        if (this.ctx) return;
        
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        this.ctx = new AudioContext();
        this.bgmGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        
        this.bgmGain.connect(this.ctx.destination);
        this.sfxGain.connect(this.ctx.destination);
        
        // Master Volumes: BGM is gentle (0.15), SFX is prominent (0.85)
        this.bgmGain.gain.value = 1;
        this.sfxGain.gain.value = 0.85;
        this.isBgmMuted = false;
        this.isSfxMuted = false;
        
        // BGM Setup — "BGMM_Login.mp3" (Heroic tribal ambient, gentle for thinking)
        this.bgm = new Audio("/assest/music/BGMM_Login.mp3");
        this.bgm.loop = true;
        
        try {
            const source = this.ctx.createMediaElementSource(this.bgm);
            this.localBgmGain = this.ctx.createGain();
            this.localBgmGain.gain.value = 0.15; // Soft BGM
            source.connect(this.localBgmGain);
            this.localBgmGain.connect(this.bgmGain);
        } catch (e) {
            console.warn("Failed to create media element source", e);
        }

        // Global User Interaction Listener to unblock AudioContext & play BGM
        const unlockAudio = () => {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            this.playBGM();
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
        window.addEventListener('pointerdown', unlockAudio);
        window.addEventListener('keydown', unlockAudio);

        // Preload SFX audio buffers for zero latency
        this.buffers = {};
        this.loadSFXBuffer('click', '/assest/music/Button1.mp3');
        this.loadSFXBuffer('swipe', '/assest/music/CardSwipeAll.mp3');
        this.loadSFXBuffer('attack', '/assest/music/CharHit.mp3');
        this.loadSFXBuffer('collect', '/assest/music/ExpEarn.mp3');
        this.loadSFXBuffer('levelUp', '/assest/music/LevelUp.mp3');
        this.loadSFXBuffer('defeat', '/assest/music/CharKnockDown.mp3');
    }
    
    static async loadSFXBuffer(key, url) {
        try {
            const res = await fetch(url);
            const arrayBuf = await res.arrayBuffer();
            this.buffers[key] = await this.ctx.decodeAudioData(arrayBuf);
        } catch (e) {
            console.warn(`Failed to load audio buffer: ${key}`, e);
        }
    }
    
    static playBGM() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (this.bgm && !this.isBgmMuted) {
            this.bgm.play().catch(e => console.log("BGM deferred until interaction:", e));
        }
    }
    
    static toggleBGM() {
        if (!this.ctx) this.init();
        this.isBgmMuted = !this.isBgmMuted;
        this.bgmGain.gain.value = this.isBgmMuted ? 0 : 1;
        if (!this.isBgmMuted) {
            this.playBGM();
        } else if (this.bgm) {
            this.bgm.pause();
        }
        return this.isBgmMuted;
    }

    static toggleSFX() {
        if (!this.ctx) this.init();
        this.isSfxMuted = !this.isSfxMuted;
        this.sfxGain.gain.value = this.isSfxMuted ? 0 : 0.85;
        return this.isSfxMuted;
    }

    static toggleMute() {
        this.toggleBGM();
        this.toggleSFX();
        return this.isBgmMuted;
    }

    static playBufferSFX(key, volume = 0.5) {
        if (!this.ctx || this.isSfxMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        if (this.buffers && this.buffers[key]) {
            const source = this.ctx.createBufferSource();
            source.buffer = this.buffers[key];
            const gainNode = this.ctx.createGain();
            gainNode.gain.value = volume;
            source.connect(gainNode);
            gainNode.connect(this.sfxGain);
            source.start(0);
        }
    }
    
    static playClickSFX() {
        if (this.buffers && this.buffers['click']) {
            this.playBufferSFX('click', 0.6);
        } else {
            this.playOscillator("sine", 600, 900, 0.06);
        }
    }
    
    static playSwipeSFX() {
        if (this.buffers && this.buffers['swipe']) {
            this.playBufferSFX('swipe', 0.4);
        } else {
            this.playOscillator("sine", 300, 600, 0.1);
        }
    }
    
    static playAttackSFX() {
        if (this.buffers && this.buffers['attack']) {
            this.playBufferSFX('attack', 0.8);
        } else {
            this.playOscillator("sawtooth", 150, 50, 0.15);
        }
    }
    
    static playCollectSFX() {
        if (this.buffers && this.buffers['collect']) {
            this.playBufferSFX('collect', 0.7);
        } else {
            this.playOscillator("square", 600, 1200, 0.1);
        }
    }

    static playLevelUpSFX() {
        if (this.buffers && this.buffers['levelUp']) {
            this.playBufferSFX('levelUp', 0.7);
        } else {
            this.playOscillator("sine", 400, 1000, 0.3);
        }
    }

    static playDefeatSFX() {
        if (this.buffers && this.buffers['defeat']) {
            this.playBufferSFX('defeat', 0.8);
        } else {
            this.playOscillator("sawtooth", 200, 40, 0.4);
        }
    }
    
    static playOscillator(type, startFreq, endFreq, duration) {
        if (!this.ctx || this.isSfxMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
        
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
}
