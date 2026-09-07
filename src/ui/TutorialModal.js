import { Container, Graphics, Text, TextStyle, BlurFilter } from 'pixi.js';
import { CapsuleBtn } from './Button.js';
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

        // Dark overlay
        this.overlay = new Graphics()
            .rect(0, 0, width, height)
            .fill({ color: 0x000000, alpha: 0.8 });
        this.overlay.eventMode = 'static'; // Block clicks
        this.addChild(this.overlay);

        this.panel = new Container();
        this.panel.position.set(width / 2, height / 2);
        this.addChild(this.panel);

        const panelWidth = 320;
        const panelHeight = 500;

        const bg = new Graphics()
            .roundRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 20)
            .fill({ color: 0x2A2A35 })
            .stroke({ color: 0xCBC4D0, width: 4 });
        this.panel.addChild(bg);

        const title = new Text({
            text: "HƯỚNG DẪN TÂN THỦ",
            style: new TextStyle({
                fontFamily: ['Be Vietnam Pro', 'sans-serif'],
                fontSize: 24,
                fill: 0xFFCA28,
                fontWeight: '900',
                dropShadow: { alpha: 0.5, blur: 2, distance: 2, color: 0x000000 }
            })
        });
        title.anchor.set(0.5);
        title.position.set(0, -panelHeight / 2 + 40);
        this.panel.addChild(title);

        const rules = [
            "👆 Vuốt trên bàn hoặc dùng phím mũi tên. Mỗi lần đi 1 ô.",
            "⚔️ Phải MẠNH HƠN quái để thắng và cộng sức mạnh của nó. Bằng nhau là thua.",
            "🍔 + là cộng, × là nhân; ÷ là bẫy chia sức mạnh, làm tròn xuống.",
            "⚠️ Sàn SẬP khi rời ô. Ô đỏ có thể hạ bạn; hãy tính đường trước khi đi.",
            "👑 Hạ boss để qua tầng. Sức mạnh boss giữ nguyên trong cả tầng.",
            "↻ Có 3 lượt hoàn tác mỗi ván; mỗi lần lùi 1 bước, kể cả bước thua. Mỗi tầng bắt đầu với 10 sức mạnh."
        ];

        let startY = -panelHeight / 2 + 100;
        rules.forEach(rule => {
            const txt = new Text({
                text: rule,
                style: new TextStyle({
                    fontFamily: ['Be Vietnam Pro', 'sans-serif'],
                    fontSize: 14,
                    fill: 0xFFFFFF,
                    wordWrap: true,
                    wordWrapWidth: panelWidth - 40,
                    lineHeight: 20
                })
            });
            txt.anchor.set(0, 0);
            txt.position.set(-panelWidth / 2 + 20, startY);
            this.panel.addChild(txt);
            startY += 51;
        });

        const startBtn = new CapsuleBtn("BẮT ĐẦU", () => this.close(), 200, 50, '#4CAF50', '#388E3C', '#1B5E20');
        startBtn.position.set(0, panelHeight / 2 - 45);
        this.panel.addChild(startBtn);

        // Entrance animation
        this.resize(width, height);
        this.panel.scale.set(this.fitScale * 0.5);
        this.panel.alpha = 0;
        this.overlay.alpha = 0;
        gsap.to(this.overlay, { alpha: 0.8, duration: 0.3 });
        gsap.to(this.panel.scale, { x: this.fitScale, y: this.fitScale, duration: 0.4, ease: "back.out(1.5)" });
        gsap.to(this.panel, { alpha: 1, duration: 0.3 });
    }

    resize(width, height) {
        this.overlay.clear().rect(0, 0, width, height).fill({ color: 0x000000, alpha: 0.8 });
        this.panel.position.set(width / 2, height / 2);
        this.fitScale = Math.min(1, (width - 24) / 320, (height - 24) / 500);
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
