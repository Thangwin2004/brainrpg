import { Container, Graphics, FillGradient, Text, TextStyle } from 'pixi.js';
import { AudioManager } from '../managers/AudioManager.js';
import { IconBtn } from './Button.js';

export class SettingsModal extends Container {
    constructor(onClose, onRestart, onHome) {
        super();
        this.onClose = onClose;
        this.onRestart = onRestart;
        this.onHome = onHome;
        this.initUI();
    }
    
    initUI() {
        const hasExtraBtns = !!(this.onRestart || this.onHome);
        const cardW = 380;
        const cardH = hasExtraBtns ? 380 : 260;

        // Overlay Backdrop
        const backdrop = new Graphics().rect(-2000, -2000, 4000, 4000).fill({ color: 0x000000, alpha: 0.5 });
        backdrop.eventMode = 'static';
        this.addChild(backdrop);

        this.modal = new Container();
        this.addChild(this.modal);
        
        // White Card with soft lavender shadow (no border)
        const cardFace = new Graphics()
          .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 28)
          .fill({ color: 0xFFFFFF });
        this.modal.addChild(cardFace);

        // Title Ribbon — Lavender gradient
        const ribbonW = 220;
        const ribbonH = 42;
        const ribbonY = -cardH / 2;
        const ribbonRadius = ribbonH / 2;
        
        const ribGrad = new FillGradient(0, ribbonY - ribbonH / 2, 0, ribbonY + ribbonH / 2);
        ribGrad.addColorStop(0, 0xB39DDB);
        ribGrad.addColorStop(1, 0x7E57C2);
        
        const ribbon = new Graphics()
          .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2 + 4, ribbonW, ribbonH, ribbonRadius)
          .fill({ color: 0x4A148C, alpha: 0.3 })
          .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2, ribbonW, ribbonH, ribbonRadius)
          .fill(ribGrad)
          .stroke({ color: 0xffffff, width: 3 });
        this.modal.addChild(ribbon);

        const titleText = new Text({
          text: "CÀI ĐẶT",
          style: new TextStyle({
            fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
            fontSize: 20,
            fill: 0xffffff,
            fontWeight: "700",
            letterSpacing: 2
          }),
        });
        titleText.anchor.set(0.5);
        titleText.position.set(0, ribbonY);
        this.modal.addChild(titleText);
        
        // BGM Row
        const bgmRowY = hasExtraBtns ? -100 : -35;
        const bgmRowBg = new Graphics()
            .roundRect(-160, bgmRowY - 24, 320, 48, 24)
            .fill({ color: 0xF3F3F4 });
        this.modal.addChild(bgmRowBg);
        
        const bgmLabel = new Text({
            text: "NHẠC NỀN",
            style: new TextStyle({
                fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
                fontSize: 16,
                fontWeight: "700",
                letterSpacing: 0.8,
                fill: 0x453268
            })
        });
        bgmLabel.anchor.set(0, 0.5);
        bgmLabel.position.set(-140, bgmRowY);
        this.modal.addChild(bgmLabel);
        
        this.bgmToggleBtn = new Graphics();
        this.bgmToggleBtn.position.set(110, bgmRowY);
        this.bgmToggleBtn.eventMode = 'static';
        this.bgmToggleBtn.cursor = 'pointer';
        this.bgmToggleBtn.on('pointerdown', () => {
            AudioManager.playClickSFX();
            AudioManager.toggleBGM();
            this.updateBgmToggle();
        });
        this.modal.addChild(this.bgmToggleBtn);

        // SFX Row
        const sfxRowY = hasExtraBtns ? -40 : 25;
        const sfxRowBg = new Graphics()
            .roundRect(-160, sfxRowY - 24, 320, 48, 24)
            .fill({ color: 0xF3F3F4 });
        this.modal.addChild(sfxRowBg);
        
        const sfxLabel = new Text({
            text: "HIỆU ỨNG",
            style: new TextStyle({
                fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
                fontSize: 16,
                fontWeight: "700",
                letterSpacing: 0.8,
                fill: 0x453268
            })
        });
        sfxLabel.anchor.set(0, 0.5);
        sfxLabel.position.set(-140, sfxRowY);
        this.modal.addChild(sfxLabel);
        
        this.sfxToggleBtn = new Graphics();
        this.sfxToggleBtn.position.set(110, sfxRowY);
        this.sfxToggleBtn.eventMode = 'static';
        this.sfxToggleBtn.cursor = 'pointer';
        this.sfxToggleBtn.on('pointerdown', () => {
            AudioManager.playClickSFX();
            AudioManager.toggleSFX();
            this.updateSfxToggle();
        });
        this.modal.addChild(this.sfxToggleBtn);

        this.updateToggle();

        // Action Icon Buttons (side by side, well-spaced)
        if (hasExtraBtns) {
            const btnY = 55;
            
            if (this.onRestart) {
                const restartSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
                const restartBtn = new IconBtn(restartSvg, () => {
                    if (this.onRestart) this.onRestart();
                }, 30, '#FF8A80', '#E57373', '#D32F2F');
                restartBtn.position.set(this.onHome ? -55 : 0, btnY);
                this.modal.addChild(restartBtn);
            }

            if (this.onHome) {
                const homeSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
                const homeBtn = new IconBtn(homeSvg, () => {
                    if (this.onHome) this.onHome();
                }, 30, '#B39DDB', '#9575CD', '#7E57C2');
                homeBtn.position.set(this.onRestart ? 55 : 0, btnY);
                this.modal.addChild(homeBtn);
            }
        }
        
        // Close Button — Coral accent
        this.closeBtn = new Graphics();
        const closeR = 18;
        this.closeBtn.circle(0, 0, closeR).fill({ color: 0xFF8A80 }).stroke({ color: 0xffffff, width: 3 });
        const xText = new Text({ text: "✕", style: new TextStyle({ fill: 0xffffff, fontSize: 20, fontWeight: 'bold' }) });
        xText.anchor.set(0.5);
        this.closeBtn.addChild(xText);
        
        this.closeBtn.position.set(cardW / 2 - 18, -cardH / 2 + 18);
        this.closeBtn.eventMode = 'static';
        this.closeBtn.cursor = 'pointer';
        this.closeBtn.on('pointerdown', () => {
            AudioManager.playClickSFX();
            if (this.onClose) this.onClose();
        });
        this.modal.addChild(this.closeBtn);
    }
    
    updateToggle() {
        this.updateBgmToggle();
        this.updateSfxToggle();
    }

    updateBgmToggle() {
        this.bgmToggleBtn.clear();
        const isMuted = AudioManager.isBgmMuted;
        const color = isMuted ? 0xCBC4D0 : 0x80CBC4; // Mint when ON
        const knobX = isMuted ? -15 : 15;
        this.bgmToggleBtn.roundRect(-30, -15, 60, 30, 15).fill({ color });
        this.bgmToggleBtn.circle(knobX, 0, 12).fill({ color: 0xffffff });
    }

    updateSfxToggle() {
        this.sfxToggleBtn.clear();
        const isMuted = AudioManager.isSfxMuted;
        const color = isMuted ? 0xCBC4D0 : 0x80CBC4; // Mint when ON
        const knobX = isMuted ? -15 : 15;
        this.sfxToggleBtn.roundRect(-30, -15, 60, 30, 15).fill({ color });
        this.sfxToggleBtn.circle(knobX, 0, 12).fill({ color: 0xffffff });
    }
    
    resize(width, height) {
        this.modal.position.set(width / 2, height / 2);
        const scale = Math.min(1.0, (width - 40) / 380);
        this.modal.scale.set(scale);
    }
}
