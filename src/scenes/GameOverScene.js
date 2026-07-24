import { Container, Graphics, Text, TextStyle, FillGradient } from 'pixi.js';
import { IconBtn } from '../ui/Button.js';
import { GameScene } from './GameScene.js';
import { MenuScene } from './MenuScene.js';
import gsap from 'gsap';

export class GameOverScene extends Container {
  constructor(floorReached) {
    super();
    this.floorReached = floorReached;

    // Save to local storage
    const currentMax = parseInt(localStorage.getItem('swipeRpgMaxFloor')) || 1;
    this.isNewRecord = this.floorReached > currentMax;
    if (this.isNewRecord) {
      localStorage.setItem('swipeRpgMaxFloor', this.floorReached);
    }
  }

  init(game) {
    this.game = game;
    const { width, height } = game.app.screen;

    // Background — Lumina Play Lavender Gradient
    const bgGrad = new FillGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#B39DDB');
    bgGrad.addColorStop(1, '#7E57C2');

    this.bg = new Graphics().rect(0, 0, width, height).fill(bgGrad);
    this.addChild(this.bg);

    // Floating particles (decorative circles)
    this.particles = [];
    for (let i = 0; i < 12; i++) {
      const p = new Graphics()
        .circle(0, 0, 4 + Math.random() * 8)
        .fill({ color: 0xffffff, alpha: 0.15 + Math.random() * 0.15 });
      p.position.set(Math.random() * width, Math.random() * height);
      this.addChild(p);
      this.particles.push(p);

      gsap.to(p, {
        y: p.y - 60 - Math.random() * 80,
        alpha: 0,
        duration: 2 + Math.random() * 3,
        repeat: -1,
        delay: Math.random() * 2,
        ease: "power1.out",
        onRepeat: () => {
          p.position.set(Math.random() * width, height + 20);
          p.alpha = 0.15 + Math.random() * 0.15;
        }
      });
    }

    // Create Card Modal
    this.modal = new Container();
    this.addChild(this.modal);

    const cardW = 360;
    const cardH = 380;

    // White Card
    const cardFace = new Graphics()
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 28)
      .fill({ color: 0xFFFFFF });
    this.modal.addChild(cardFace);

    // Title Ribbon — Coral accent
    const ribbonW = 240;
    const ribbonH = 42;
    const ribbonY = -cardH / 2;
    const ribbonRadius = ribbonH / 2;

    const ribGrad = new FillGradient(0, ribbonY - ribbonH / 2, 0, ribbonY + ribbonH / 2);
    ribGrad.addColorStop(0, 0xFF8A80);
    ribGrad.addColorStop(1, 0xE57373);

    const ribbon = new Graphics()
      .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2 + 4, ribbonW, ribbonH, ribbonRadius)
      .fill({ color: 0xD32F2F, alpha: 0.3 })
      .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2, ribbonW, ribbonH, ribbonRadius)
      .fill(ribGrad)
      .stroke({ color: 0xffffff, width: 3 });
    this.modal.addChild(ribbon);

    const titleText = new Text({
      text: "KẾT THÚC",
      style: new TextStyle({
        fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
        fontSize: 22,
        fill: 0xffffff,
        fontWeight: "700",
        letterSpacing: 2
      }),
    });
    titleText.anchor.set(0.5);
    titleText.position.set(0, ribbonY);
    this.modal.addChild(titleText);

    // Big Emoji — animated
    this.emoji = new Text({
      text: this.isNewRecord ? "🏆" : "💀",
      style: new TextStyle({ fontSize: 64 })
    });
    this.emoji.anchor.set(0.5);
    this.emoji.position.set(0, -80);
    this.modal.addChild(this.emoji);

    gsap.from(this.emoji.scale, { x: 0, y: 0, duration: 0.5, ease: "back.out(2)", delay: 0.2 });
    gsap.to(this.emoji, { y: -85, duration: 1.5, yoyo: true, repeat: -1, ease: "sine.inOut" });

    // Label
    const labelText = this.isNewRecord ? "KỶ LỤC MỚI! 🎉" : "SỐ TẦNG ĐẠT ĐƯỢC";
    const info = new Text({
      text: labelText,
      style: new TextStyle({
        fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
        fontSize: 18,
        fill: this.isNewRecord ? 0xFF8A80 : 0x7a7580,
        fontWeight: "700",
        align: 'center'
      })
    });
    info.anchor.set(0.5);
    info.position.set(0, -25);
    this.modal.addChild(info);

    // Animated Score Counter
    this.scoreVal = new Text({
      text: "0",
      style: new TextStyle({
        fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
        fontSize: 64,
        fill: 0x7E57C2,
        fontWeight: "700"
      })
    });
    this.scoreVal.anchor.set(0.5);
    this.scoreVal.position.set(0, 30);
    this.modal.addChild(this.scoreVal);

    // Count up animation
    const counter = { val: 0 };
    gsap.to(counter, {
      val: this.floorReached,
      duration: Math.min(1.5, this.floorReached * 0.15),
      delay: 0.4,
      ease: "power2.out",
      onUpdate: () => {
        if (this.scoreVal && !this.scoreVal.destroyed) {
          this.scoreVal.text = `${Math.round(counter.val)}`;
        }
      }
    });

    // Score pulse
    gsap.from(this.scoreVal.scale, { x: 0.5, y: 0.5, duration: 0.4, ease: "back.out(2)", delay: 0.3 });

    // Best Score line
    const bestFloor = parseInt(localStorage.getItem('swipeRpgMaxFloor')) || 1;
    const bestText = new Text({
      text: `Tốt nhất: ${bestFloor}`,
      style: new TextStyle({
        fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
        fontSize: 14,
        fill: 0xB39DDB,
        fontWeight: '600'
      })
    });
    bestText.anchor.set(0.5);
    bestText.position.set(0, 75);
    this.modal.addChild(bestText);

    // === Buttons Row — EQUAL SIZE ===
    const btnSize = 35;
    const btnGap = 45;
    const btnY = 130;

    // Home Button — Lavender
    const homeSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
    const homeBtn = new IconBtn(homeSvg, () => {
      this.game.setScene(new MenuScene());
    }, btnSize, '#B39DDB', '#9575CD', '#7E57C2');
    homeBtn.position.set(-btnGap, btnY);
    this.modal.addChild(homeBtn);

    // Replay Button — Coral accent
    const replaySvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
    const replayBtn = new IconBtn(replaySvg, () => {
      this.game.setScene(new GameScene());
    }, btnSize, '#FF8A80', '#E57373', '#D32F2F');
    replayBtn.position.set(btnGap, btnY);
    this.modal.addChild(replayBtn);

    // Card entrance animation
    this.modal.scale.set(0.8);
    this.modal.alpha = 0;
    gsap.to(this.modal, { alpha: 1, duration: 0.3 });
    gsap.to(this.modal.scale, { x: 1, y: 1, duration: 0.5, ease: "back.out(1.5)" });

    this.resize(width, height);
  }

  resize(width, height) {
    if (this.bg) {
      const bgGrad = new FillGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#B39DDB');
      bgGrad.addColorStop(1, '#7E57C2');
      this.bg.clear().rect(0, 0, width, height).fill(bgGrad);
    }
    
    if (this.modal) {
      this.modal.position.set(width / 2, height / 2);
      const scale = Math.min(1.0, (width - 40) / 360);
      this.modal.scale.set(scale);
    }
  }

  destroy(options) {
    if (this.particles) {
      this.particles.forEach(p => gsap.killTweensOf(p));
    }
    if (this.emoji) gsap.killTweensOf(this.emoji);
    if (this.scoreVal) gsap.killTweensOf(this.scoreVal);
    if (this.modal) {
      gsap.killTweensOf(this.modal);
      gsap.killTweensOf(this.modal.scale);
    }
    gsap.killTweensOf(this);
    super.destroy(options);
  }
}
