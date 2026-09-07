import { Container, Graphics, FillGradient, Text, TextStyle, BlurFilter } from 'pixi.js';
import { AudioManager } from '../managers/AudioManager.js';
import { IconBtn } from './Button.js';
import { i18n, t } from '../system/I18nManager.js';

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
        const cardH = hasExtraBtns ? 480 : 390;

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
          .fill({ color: 0x9575CD })
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
          .fill({ color: 0x512DA8 })
          .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2, ribbonW, ribbonH, ribbonRadius)
          .fill(ribbonGrad)
          .stroke({ color: 0xffffff, width: 3.5 })
          .ellipse(0, ribbonY - ribbonH / 4, ribbonW * 0.42, ribbonH * 0.2)
          .fill({ color: 0xffffff, alpha: 0.25 });
        this.modal.addChild(ribbon);

        this.titleText = new Text({
          text: t("settings.title"),
          style: new TextStyle({
            fontFamily: ['Be Vietnam Pro', 'sans-serif'],
            fontSize: 22,
            fill: 0xffffff,
            fontWeight: "900",
            letterSpacing: 2
          }),
        });
        this.titleText.anchor.set(0.5);
        this.titleText.position.set(0, ribbonY);
        this.modal.addChild(this.titleText);

        const rowStyle = new TextStyle({
            fontFamily: ['Be Vietnam Pro', 'sans-serif'],
            fontSize: 17,
            fontWeight: "bold",
            letterSpacing: 0.8,
            fill: 0x4A148C
        });

        // 1. BGM Row
        const bgmRowY = hasExtraBtns ? -130 : -80;
        const bgmRowBg = new Graphics()
            .roundRect(-165, bgmRowY - 30, 330, 60, 14)
            .fill({ color: 0xffffff })
            .stroke({ color: 0xD1C4E9, width: 2.5 });
        this.modal.addChild(bgmRowBg);

        this.bgmLabel = new Text({ text: t("settings.music"), style: rowStyle });
        this.bgmLabel.anchor.set(0, 0.5);
        this.bgmLabel.position.set(-145, bgmRowY);
        this.modal.addChild(this.bgmLabel);

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

        // 2. SFX Row
        const sfxRowY = hasExtraBtns ? -55 : -5;
        const sfxRowBg = new Graphics()
            .roundRect(-165, sfxRowY - 30, 330, 60, 14)
            .fill({ color: 0xffffff })
            .stroke({ color: 0xD1C4E9, width: 2.5 });
        this.modal.addChild(sfxRowBg);

        this.sfxLabel = new Text({ text: t("settings.sfx"), style: rowStyle });
        this.sfxLabel.anchor.set(0, 0.5);
        this.sfxLabel.position.set(-145, sfxRowY);
        this.modal.addChild(this.sfxLabel);

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

        // 3. Language Row (NEW)
        const langRowY = hasExtraBtns ? 20 : 70;
        const langRowBg = new Graphics()
            .roundRect(-165, langRowY - 30, 330, 60, 14)
            .fill({ color: 0xffffff })
            .stroke({ color: 0xD1C4E9, width: 2.5 });
        this.modal.addChild(langRowBg);

        this.langLabel = new Text({ text: t("settings.language"), style: rowStyle });
        this.langLabel.anchor.set(0, 0.5);
        this.langLabel.position.set(-145, langRowY);
        this.modal.addChild(this.langLabel);

        this.langBtn = new Container();
        this.langBtn.position.set(100, langRowY);
        this.langBtn.eventMode = 'static';
        this.langBtn.cursor = 'pointer';

        this.langBtnBg = new Graphics();
        this.langBtn.addChild(this.langBtnBg);

        this.langBtnText = new Text({
            text: i18n.language === 'en' ? 'English' : 'Tiếng Việt',
            style: new TextStyle({
                fontFamily: ['Be Vietnam Pro', 'sans-serif'],
                fontSize: 14,
                fontWeight: '900',
                fill: 0x4A148C
            })
        });
        this.langBtnText.anchor.set(0.5);
        this.langBtn.addChild(this.langBtnText);

        this.langBtn.on('pointerdown', () => {
            AudioManager.playClickSFX();
            const nextLang = i18n.language === 'en' ? 'vi' : 'en';
            i18n.setLanguage(nextLang);
            this.refreshLabels();
        });
        this.modal.addChild(this.langBtn);

        this.updateToggle();
        this.updateLangBtn();

        // 4. Action Icon Buttons
        if (hasExtraBtns) {
            const btnY = 145;

            if (this.onRestart) {
                const restartSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
                const restartBtn = new IconBtn(restartSvg, () => {
                    if (this.onRestart) this.onRestart();
                }, 35, '#D1C4E9', '#B39DDB', '#9575CD');
                restartBtn.position.set(this.onHome ? -65 : 0, btnY);
                this.modal.addChild(restartBtn);
            }

            if (this.onHome) {
                const homeSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
                const homeBtn = new IconBtn(homeSvg, () => {
                    if (this.onHome) this.onHome();
                }, 35, '#FFD54F', '#FFCA28', '#FFB300');
                homeBtn.position.set(this.onRestart ? 65 : 0, btnY);
                this.modal.addChild(homeBtn);
            }
        }

        // Close Button
        const closeSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
        this.closeBtn = new IconBtn(closeSvg, () => {
            if (this.onClose) this.onClose();
        }, 22, '#D1C4E9', '#B39DDB', '#9575CD');

        this.closeBtn.position.set(cardW / 2 - 20, -cardH / 2 + 20);
        this.modal.addChild(this.closeBtn);
    }

    refreshLabels() {
        this.titleText.text = t("settings.title");
        this.bgmLabel.text = t("settings.music");
        this.sfxLabel.text = t("settings.sfx");
        this.langLabel.text = t("settings.language");
        this.updateLangBtn();
    }

    updateLangBtn() {
        const isEn = i18n.language === 'en';
        this.langBtnText.text = isEn ? 'EN 🇬🇧' : 'VI 🇻🇳';
        this.langBtnBg.clear()
            .roundRect(-42, -16, 84, 32, 16)
            .fill({ color: 0xF3E5F5 })
            .stroke({ color: 0xB39DDB, width: 2 });
    }

    updateToggle() {
        this.updateBgmToggle();
        this.updateSfxToggle();
    }

    updateBgmToggle() {
        this.bgmToggleBtn.clear();
        const isMuted = AudioManager.isBgmMuted;
        const color = isMuted ? 0xCBC4D0 : 0x81C784; // Green when ON
        const knobX = isMuted ? -15 : 15;
        this.bgmToggleBtn.roundRect(-30, -15, 60, 30, 15).fill({ color }).stroke({ color: 0xFFFFFF, width: 2 });
        this.bgmToggleBtn.circle(knobX, 0, 12).fill({ color: 0xffffff });
    }

    updateSfxToggle() {
        this.sfxToggleBtn.clear();
        const isMuted = AudioManager.isSfxMuted;
        const color = isMuted ? 0xCBC4D0 : 0x81C784; // Green when ON
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
