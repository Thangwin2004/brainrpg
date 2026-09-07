import { Container, Graphics, FillGradient, Text, TextStyle, BlurFilter } from 'pixi.js';
import { CapsuleBtn } from './Button.js';
import { t } from '../system/I18nManager.js';
import gsap from 'gsap';

export class TutorialModal extends Container {
    constructor(width, height, onClose) {
        super();
        this.onClose = onClose;

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

        // Dark overlay backdrop
        this.overlay = new Graphics()
            .rect(0, 0, width, height)
            .fill({ color: 0x000000, alpha: 0.75 });
        this.overlay.eventMode = 'static';
        this.addChild(this.overlay);

        this.panel = new Container();
        this.panel.position.set(width / 2, height / 2);
        this.addChild(this.panel);

        const cardW = 340;
        const cardH = 520;

        // 1. Soft Card Shadow
        const cardShadow = new Graphics()
            .roundRect(-cardW / 2 + 6, -cardH / 2 + 12, cardW, cardH, 20)
            .fill({ color: 0x000000, alpha: 0.25 });
        this.panel.addChild(cardShadow);

        // 2. Thick 3D Soft Purple Border (Swipe-RPG signature theme)
        const borderGrad = new FillGradient(0, -cardH / 2, 0, cardH / 2);
        borderGrad.addColorStop(0, 0xD1C4E9);
        borderGrad.addColorStop(1, 0xB39DDB);

        const borderBg = new Graphics()
            .roundRect(-cardW / 2, -cardH / 2 + 6, cardW, cardH, 20)
            .fill({ color: 0x9575CD })
            .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 20)
            .fill(borderGrad);
        this.panel.addChild(borderBg);

        // 3. Bright Cream Card Face
        const cardFace = new Graphics()
            .roundRect(-cardW / 2 + 12, -cardH / 2 + 12, cardW - 24, cardH - 24, 14)
            .fill({ color: 0xfbfaf5 });
        this.panel.addChild(cardFace);

        // 4. Floating 3D Title Ribbon (Purple)
        const ribbonW = 230;
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
        this.panel.addChild(ribbon);

        const title = new Text({
            text: t("tutorial.title"),
            style: new TextStyle({
                fontFamily: ['Be Vietnam Pro', 'sans-serif'],
                fontSize: 20,
                fill: 0xffffff,
                fontWeight: '900',
                letterSpacing: 1.2
            })
        });
        title.anchor.set(0.5);
        title.position.set(0, ribbonY);
        this.panel.addChild(title);

        const rules = [
            t("tutorial.rule1"),
            t("tutorial.rule2"),
            t("tutorial.rule3"),
            t("tutorial.rule4"),
            t("tutorial.rule5"),
            t("tutorial.rule6")
        ];

        let startY = -cardH / 2 + 48;
        rules.forEach(rule => {
            const rowBg = new Graphics()
                .roundRect(-cardW / 2 + 20, startY - 4, cardW - 40, 52, 10)
                .fill({ color: 0xFFFFFF, alpha: 0.9 })
                .stroke({ color: 0xEADAFF, width: 1.5 });
            this.panel.addChild(rowBg);

            const txt = new Text({
                text: rule,
                style: new TextStyle({
                    fontFamily: ['Be Vietnam Pro', 'sans-serif'],
                    fontSize: 12,
                    fill: 0x3E2768,
                    fontWeight: '600',
                    wordWrap: true,
                    wordWrapWidth: cardW - 56,
                    lineHeight: 16
                })
            });
            txt.anchor.set(0, 0);
            txt.position.set(-cardW / 2 + 28, startY + 1);
            this.panel.addChild(txt);
            startY += 58;
        });

        const startBtn = new CapsuleBtn(t("tutorial.understood"), () => this.close(), 190, 46, '#66BB6A', '#388E3C', '#1B5E20');
        startBtn.position.set(0, cardH / 2 - 40);
        this.panel.addChild(startBtn);

        // Entrance animation
        this.resize(width, height);
        this.panel.scale.set(this.fitScale * 0.5);
        this.panel.alpha = 0;
        this.overlay.alpha = 0;
        gsap.to(this.overlay, { alpha: 0.75, duration: 0.3 });
        gsap.to(this.panel.scale, { x: this.fitScale, y: this.fitScale, duration: 0.4, ease: "back.out(1.5)" });
        gsap.to(this.panel, { alpha: 1, duration: 0.3 });
    }

    resize(width, height) {
        this.overlay.clear().rect(0, 0, width, height).fill({ color: 0x000000, alpha: 0.75 });
        this.panel.position.set(width / 2, height / 2);
        this.fitScale = Math.min(1, (width - 24) / 340, (height - 24) / 520);
        gsap.killTweensOf(this.panel.scale);
        this.panel.scale.set(this.fitScale);
    }

    close() {
        if (this.closing) return;
        this.closing = true;
        gsap.to(this.panel.scale, { x: 0.5, y: 0.5, duration: 0.3, ease: "back.in(1.5)" });
        gsap.to(this.panel, { alpha: 0, duration: 0.2 });
        gsap.to(this.overlay, { alpha: 0, duration: 0.3, onComplete: () => {
            if (this.onClose) this.onClose();
            this.destroy({ children: true });
        }});
    }
}
