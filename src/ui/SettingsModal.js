import { Container, Graphics, FillGradient, Text, TextStyle, BlurFilter } from 'pixi.js';
import { AudioManager } from '../managers/AudioManager.js';
import { IconBtn } from './Button.js';

export class SettingsModal extends Container {
    constructor(onClose, onRestart, onHome) {
        super();
        this.onClose = onClose;
        this.onRestart = onRestart;
        this.onHome = onHome;
        this.initUI();
        
        // Blur siblings when added to simulate backdrop-filter
        this.on('added', () => {
            if (this.parent) {
                this.siblingFilters = new Map();
                this.parent.children.forEach(child => {
                    if (child !== this && !child.isBackdrop) {
                        const filter = new BlurFilter({ strength: 5, quality: 3 });
                        child.filters = child.filters ? [...child.filters, filter] : [filter];
                        this.siblingFilters.set(child, filter);
                    }
                });
            }
        });

        this.on('removed', () => {
            if (this.siblingFilters) {
                for (const [child, filter] of this.siblingFilters.entries()) {
                    if (child.filters) {
                        child.filters = child.filters.filter(f => f !== filter);
                        if (child.filters.length === 0) child.filters = null;
                    }
                    filter.destroy();
                }
                this.siblingFilters.clear();
                this.siblingFilters = null;
            }
        });
    }
    
    initUI() {
        const hasExtraBtns = !!(this.onRestart || this.onHome);
        const cardW = 420;
        const cardH = hasExtraBtns ? 420 : 320;

        // Overlay Backdrop
        const backdrop = new Graphics().rect(-2000, -2000, 4000, 4000).fill({ color: 0x000000, alpha: 0.65 });
        backdrop.eventMode = 'static';
        this.addChild(backdrop);

        this.modal = new Container();
        this.addChild(this.modal);
        
        // 1. Soft Card Shadow
        const cardShadow = new Graphics()
          .roundRect(-cardW / 2 + 6, -cardH / 2 + 12, cardW, cardH, 20)
          .fill({ color: 0x000000, alpha: 0.25 });
        this.modal.addChild(cardShadow);

        // 2. Thick 3D Soft Purple Border
        const borderGrad = new FillGradient(0, -cardH / 2, 0, cardH / 2);
        borderGrad.addColorStop(0, 0xD1C4E9);
        borderGrad.addColorStop(1, 0xB39DDB);

        const borderBg = new Graphics()
          .roundRect(-cardW / 2, -cardH / 2 + 6, cardW, cardH, 20)
          .fill({ color: 0x9575CD }) // Shadow Base
          .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 20)
          .fill(borderGrad);
        this.modal.addChild(borderBg);

        // 3. Bright Cream Card Face
        const cardFace = new Graphics()
          .roundRect(-cardW / 2 + 12, -cardH / 2 + 12, cardW - 24, cardH - 24, 14)
          .fill({ color: 0xfbfaf5 });
        this.modal.addChild(cardFace);

        // 4. Floating 3D Title Ribbon (Purple)
        const ribbonW = 210;
        const ribbonH = 42;
        const ribbonY = -cardH / 2;
        const ribbonRadius = ribbonH / 2;
        
        const ribbonGrad = new FillGradient(0, ribbonY - ribbonH / 2, 0, ribbonY + ribbonH / 2);
        ribbonGrad.addColorStop(0, 0x9575CD);
        ribbonGrad.addColorStop(1, 0x7E57C2);

        const ribbon = new Graphics()
          .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2 + 5, ribbonW, ribbonH, ribbonRadius)
          .fill({ color: 0x512DA8 }) // Ribbon shadow
          .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2, ribbonW, ribbonH, ribbonRadius)
          .fill(ribbonGrad)
          .stroke({ color: 0xffffff, width: 3.5 })
          .ellipse(0, ribbonY - ribbonH / 4, ribbonW * 0.42, ribbonH * 0.2)
          .fill({ color: 0xffffff, alpha: 0.25 });
        this.modal.addChild(ribbon);

        const titleText = new Text({
          text: "CÀI ĐẶT",
          style: new TextStyle({
            fontFamily: ['Be Vietnam Pro', 'sans-serif'],
            fontSize: 22,
            fill: 0xffffff,
            fontWeight: "900",
            letterSpacing: 2
          }),
        });
        titleText.anchor.set(0.5);
        titleText.position.set(0, ribbonY);
        this.modal.addChild(titleText);
        
        // Settings Toggle Panel Rows
        const rowStyle = new TextStyle({
            fontFamily: ['Be Vietnam Pro', 'sans-serif'],
            fontSize: 18,
            fontWeight: "bold",
            letterSpacing: 0.8,
            fill: 0x4A148C // Deep Purple
        });

        // BGM Row
        const bgmRowY = hasExtraBtns ? -100 : -35;
        const bgmRowBg = new Graphics()
            .roundRect(-165, bgmRowY - 32, 330, 64, 15)
            .fill({ color: 0xffffff })
            .stroke({ color: 0xD1C4E9, width: 3 });
        this.modal.addChild(bgmRowBg);
        
        const bgmLabel = new Text({ text: "NHẠC NỀN", style: rowStyle });
        bgmLabel.anchor.set(0, 0.5);
        bgmLabel.position.set(-145, bgmRowY);
        this.modal.addChild(bgmLabel);
        
        // Removed drawDots here

        this.bgmToggleBtn = new Graphics();
        this.bgmToggleBtn.position.set(115, bgmRowY);
        this.bgmToggleBtn.eventMode = 'static';
        this.bgmToggleBtn.cursor = 'pointer';
        this.bgmToggleBtn.on('pointerdown', () => {
            AudioManager.playClickSFX();
            AudioManager.toggleBGM();
            this.updateBgmToggle();
        });
        this.modal.addChild(this.bgmToggleBtn);

        // SFX Row
        const sfxRowY = hasExtraBtns ? -10 : 45;
        const sfxRowBg = new Graphics()
            .roundRect(-165, sfxRowY - 32, 330, 64, 15)
            .fill({ color: 0xffffff })
            .stroke({ color: 0xD1C4E9, width: 3 });
        this.modal.addChild(sfxRowBg);
        
        const sfxLabel = new Text({ text: "HIỆU ỨNG", style: rowStyle });
        sfxLabel.anchor.set(0, 0.5);
        sfxLabel.position.set(-145, sfxRowY);
        this.modal.addChild(sfxLabel);
        
        // Removed drawDots here

        this.sfxToggleBtn = new Graphics();
        this.sfxToggleBtn.position.set(115, sfxRowY);
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
            const btnY = 90;
            
            if (this.onRestart) {
                const restartSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
                const restartBtn = new IconBtn(restartSvg, () => {
                    if (this.onRestart) this.onRestart();
                }, 35, '#D1C4E9', '#B39DDB', '#9575CD'); // Soft Purple
                restartBtn.position.set(this.onHome ? -65 : 0, btnY);
                this.modal.addChild(restartBtn);
            }

            if (this.onHome) {
                const homeSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
                const homeBtn = new IconBtn(homeSvg, () => {
                    if (this.onHome) this.onHome();
                }, 35, '#FFD54F', '#FFCA28', '#FFB300'); // Warm Gold
                homeBtn.position.set(this.onRestart ? 65 : 0, btnY);
                this.modal.addChild(homeBtn);
            }
        }
        
        // Close Button
        const closeSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
        this.closeBtn = new IconBtn(closeSvg, () => {
            if (this.onClose) this.onClose();
        }, 22, '#D1C4E9', '#B39DDB', '#9575CD'); // Soft Purple
        
        this.closeBtn.position.set(cardW / 2 - 20, -cardH / 2 + 20);
        this.modal.addChild(this.closeBtn);
    }
    
    drawDots(startX, y, endX) {
        const dots = new Graphics();
        for (let x = startX; x < endX; x += 10) {
            dots.circle(x, y, 2).fill({ color: 0xB39DDB, alpha: 0.5 });
        }
        this.modal.addChild(dots);
    }

    updateToggle() {
        this.updateBgmToggle();
        this.updateSfxToggle();
    }

    updateBgmToggle() {
        this.bgmToggleBtn.clear();
        const isMuted = AudioManager.isBgmMuted;
        const color = isMuted ? 0xCBC4D0 : 0xFFCA28; // Warm Gold when ON
        const knobX = isMuted ? -15 : 15;
        this.bgmToggleBtn.roundRect(-30, -15, 60, 30, 15).fill({ color }).stroke({ color: 0xFFFFFF, width: 2 });
        this.bgmToggleBtn.circle(knobX, 0, 12).fill({ color: 0xffffff });
    }

    updateSfxToggle() {
        this.sfxToggleBtn.clear();
        const isMuted = AudioManager.isSfxMuted;
        const color = isMuted ? 0xCBC4D0 : 0xFFCA28; // Warm Gold when ON
        const knobX = isMuted ? -15 : 15;
        this.sfxToggleBtn.roundRect(-30, -15, 60, 30, 15).fill({ color }).stroke({ color: 0xFFFFFF, width: 2 });
        this.sfxToggleBtn.circle(knobX, 0, 12).fill({ color: 0xffffff });
    }
    
    resize(width, height) {
        this.modal.position.set(width / 2, height / 2);
        const scale = Math.min(1.0, (width - 40) / 420);
        this.modal.scale.set(scale);
    }
}
