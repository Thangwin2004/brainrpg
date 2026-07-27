import { Container, Graphics, Text, TextStyle, FillGradient, Sprite, Assets, BlurFilter } from 'pixi.js';
import { IconBtn } from '../ui/Button.js';
import { GameScene } from './GameScene.js';
import { MenuScene } from './MenuScene.js';
import { AssetManager } from '../managers/AssetManager.js';
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

    // Background — Tribal theme
    this.bgContainer = new Container();
    this.addChild(this.bgContainer);
    
    // Background image (Outside, lying on ground)
    this.bgImage = new Sprite(Assets.get('bg_gameover'));
    this.bgImage.anchor.set(0.5);
    this.bgImage.tint = 0x999999; // Slight dimming to make UI pop
    this.bgImage.filters = [new BlurFilter({ strength: 5, quality: 3 })];
    this.bgContainer.addChild(this.bgImage);

    // Dynamic Particles (Fireflies/Spores)
    this.particleContainer = new Container();
    this.addChild(this.particleContainer);
    
    this.fireflies = [];
    for (let i = 0; i < 30; i++) {
        const firefly = new Graphics();
        firefly.circle(0, 0, Math.random() * 2 + 1.5).fill({ color: 0xFFFFAA, alpha: Math.random() * 0.6 + 0.2 });
        firefly.x = Math.random() * width;
        firefly.y = Math.random() * height;
        
        // Custom properties for animation
        firefly.vx = (Math.random() - 0.5) * 0.5;
        firefly.vy = -Math.random() * 1.2 - 0.5; // Float upwards
        firefly.sinOffset = Math.random() * Math.PI * 2;
        firefly.sinSpeed = Math.random() * 0.03 + 0.01;
        
        this.particleContainer.addChild(firefly);
        this.fireflies.push(firefly);
    }

    // Ticker for fireflies
    this.game.app.ticker.add(this.updateParticles, this);

    // Create Card Modal
    this.modal = new Container();
    this.addChild(this.modal);

    const cardW = 360;
    const cardH = 380;

    // 1. Dark Shadow Base
    const shadowBg = new Graphics()
      .roundRect(-cardW / 2 + 5, -cardH / 2 + 15, cardW, cardH, 20)
      .fill({ color: 0x000000, alpha: 0.3 });
    this.modal.addChild(shadowBg);

    // 2. Thick Soft Purple Border
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
    const ribbonW = 180;
    const ribbonH = 46;
    const ribbonY = -cardH / 2;
    const ribbonRadius = ribbonH / 2;

    const ribGrad = new FillGradient(0, ribbonY - ribbonH / 2, 0, ribbonY + ribbonH / 2);
    ribGrad.addColorStop(0, 0x9575CD);
    ribGrad.addColorStop(1, 0x7E57C2);

    const ribbon = new Graphics()
      .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2 + 5, ribbonW, ribbonH, ribbonRadius)
      .fill({ color: 0x512DA8 }) // Ribbon shadow
      .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2, ribbonW, ribbonH, ribbonRadius)
      .fill(ribGrad)
      .stroke({ color: 0xffffff, width: 3.5 })
      .ellipse(0, ribbonY - ribbonH / 4, ribbonW * 0.42, ribbonH * 0.2)
      .fill({ color: 0xffffff, alpha: 0.3 });
    this.modal.addChild(ribbon);

    const titleText = new Text({
      text: "KẾT THÚC",
      style: new TextStyle({
        fontFamily: ['Be Vietnam Pro', 'sans-serif'],
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: "900",
        letterSpacing: 1
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
        fontFamily: ['Be Vietnam Pro', 'sans-serif'],
        fontSize: 18,
        fill: this.isNewRecord ? 0x7E57C2 : 0x4A148C,
        fontWeight: "800",
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
        fontFamily: ['Be Vietnam Pro', 'sans-serif'],
        fontSize: 64,
        fill: 0x7E57C2,
        fontWeight: "900"
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
        fontFamily: ['Be Vietnam Pro', 'sans-serif'],
        fontSize: 14,
        fill: 0x9575CD,
        fontWeight: '800'
      })
    });
    bestText.anchor.set(0.5);
    bestText.position.set(0, 75);
    this.modal.addChild(bestText);

    // === Buttons Row — EQUAL SIZE ===
    const btnSize = 35;
    const btnGap = 45;
    const btnY = 130;

    // Home Button — Gold
    const homeSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
    const homeBtn = new IconBtn(homeSvg, () => {
      this.game.setScene(new MenuScene());
    }, btnSize, '#FFE082', '#FFCA28', '#FFA000');
    homeBtn.position.set(-btnGap, btnY);
    this.modal.addChild(homeBtn);

    // Replay Button — Purple
    const replaySvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
    const replayBtn = new IconBtn(replaySvg, () => {
      this.game.setScene(new GameScene());
    }, btnSize, '#D1C4E9', '#B39DDB', '#9575CD');
    replayBtn.position.set(btnGap, btnY);
    this.modal.addChild(replayBtn);

    // Card entrance animation
    this.modal.scale.set(0.8);
    this.modal.alpha = 0;
    gsap.to(this.modal, { alpha: 1, duration: 0.3 });
    gsap.to(this.modal.scale, { x: 1, y: 1, duration: 0.5, ease: "back.out(1.5)" });

    this.resize(width, height);
  }

  updateParticles() {
      if (!this.fireflies) return;
      const { width, height } = this.game.app.screen;
      const time = performance.now() * 0.001;
      
      this.fireflies.forEach(firefly => {
          firefly.x += firefly.vx + Math.sin(time * 2 + firefly.sinOffset) * firefly.sinSpeed;
          firefly.y += firefly.vy;
          
          if (firefly.y < -10) {
              firefly.y = height + 10;
              firefly.x = Math.random() * width;
          }
          if (firefly.x < -10) firefly.x = width + 10;
          if (firefly.x > width + 10) firefly.x = -10;
      });
  }

  resize(width, height) {
    if (this.bgImage && this.bgImage.texture) {
        const isLandscape = width > height;
        const scale = isLandscape 
            ? Math.max(width / this.bgImage.texture.width, height / this.bgImage.texture.height)
            : Math.max(width / this.bgImage.texture.width, height / this.bgImage.texture.height);
        
        // Position and scale background to cover
        this.bgImage.position.set(width / 2, height / 2);
        this.bgImage.scale.set(scale);
    }
    
    if (this.modal) {
      this.modal.position.set(width / 2, height / 2);
      const scale = Math.min(1.0, (width - 40) / 360);
      this.modal.scale.set(scale);
    }
  }

  destroy(options) {
    if (this.game && this.game.app && this.game.app.ticker) {
        this.game.app.ticker.remove(this.updateParticles, this);
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
