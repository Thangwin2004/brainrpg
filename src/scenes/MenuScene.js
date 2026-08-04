import { Container, Graphics, Text, TextStyle, FillGradient, Sprite, Assets, BlurFilter } from 'pixi.js';
import { IconBtn, CapsuleBtn } from '../ui/Button.js';
import { GameScene } from './GameScene.js';
import { AssetManager } from '../managers/AssetManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { SettingsModal } from '../ui/SettingsModal.js';
import { LeaderboardModal } from '../ui/LeaderboardModal.js';

export class MenuScene extends Container {
  init(game) {
    this.game = game;
    const { width, height } = game.app.screen;
    
    // Auto-start BGM on Home Screen
    AudioManager.playBGM();
    
    // 1. Background System
    this.bgContainer = new Container();
    this.addChild(this.bgContainer);

    
    // 2. Dynamic Particles (Fireflies/Spores)
    this.particleContainer = new Container();
    this.addChild(this.particleContainer);
    
    this.fireflies = [];
    for (let i = 0; i < 40; i++) {
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
    
    // 3. Floating Title
    this.titleContainer = new Container();
    this.titleContainer.position.set(width / 2, height * 0.28);
    this.addChild(this.titleContainer);
    
    this.titleText = new Text({
      text: "HÀNH TRÌNH\nBỘ LẠC",
      style: new TextStyle({ 
        fontFamily: ['Quicksand', 'Be Vietnam Pro', 'sans-serif'],
        fill: 0xFFFFFF, 
        fontSize: 52, 
        fontWeight: '900', 
        align: 'center',
        lineHeight: 60,
        stroke: { color: 0x311B92, width: 8 }, // Thick deep purple stroke
        dropShadow: { color: 0x311B92, alpha: 0.5, blur: 0, distance: 6 } // Solid drop shadow
      })
    });
    this.titleText.anchor.set(0.5);
    this.titleContainer.addChild(this.titleText);
    
    // 4. Main Play Button (Capsule, Warm Gold)
    this.playBtn = new CapsuleBtn("CHƠI NGAY", () => {
      AudioManager.playBGM();
      this.game.setScene(new GameScene());
    }, 220, 64, '#FFD54F', '#FFCA28', '#FFB300'); // Warm Gold palette
    this.playBtn.position.set(width / 2, height * 0.55);
    this.addChild(this.playBtn);
    
    // 5. Leaderboard & Settings Buttons (Soft Purple, side-by-side)
    const lbSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M16 11V3H8v6H2v12h20V11h-6zm-6-6h4v14h-4V5zm-6 6h4v8H4v-8zm16 8h-4v-6h4v6z"/></svg>`;
    this.lbBtn = new IconBtn(lbSvg, () => {
      if (!this.lbModal) {
          this.lbModal = new LeaderboardModal(() => {
              this.removeChild(this.lbModal);
              this.lbModal = null;
          });
          this.lbModal.resize(this.game.app.screen.width, this.game.app.screen.height);
          this.addChild(this.lbModal);
      }
    }, 32, '#D1C4E9', '#B39DDB', '#9575CD'); // Soft Purple
    this.lbBtn.position.set(width / 2 - 50, height * 0.7);
    this.addChild(this.lbBtn);

    const settingsSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`;
    this.settingsBtn = new IconBtn(settingsSvg, () => {
      if (!this.settingsModal) {
          this.settingsModal = new SettingsModal(() => {
              this.removeChild(this.settingsModal);
              this.settingsModal = null;
          });
          this.settingsModal.resize(this.game.app.screen.width, this.game.app.screen.height);
          this.addChild(this.settingsModal);
      }
    }, 32, '#D1C4E9', '#B39DDB', '#9575CD'); // Soft Purple
    this.settingsBtn.position.set(width / 2 + 50, height * 0.7);
    this.addChild(this.settingsBtn);
    
    // 6. Loading Progress Bar Container
    this.loadingContainer = new Container();
    this.loadingContainer.position.set(width / 2, height * 0.78);
    
    this.barWidth = Math.min(width * 0.7, 280);
    this.barHeight = 18;
    
    this.progressBarBg = new Graphics();
    this.progressBarBg.roundRect(-this.barWidth / 2, -this.barHeight / 2, this.barWidth, this.barHeight, 9)
      .fill({ color: 0xffffff, alpha: 0.3 })
      .stroke({ color: 0xffffff, width: 2, alpha: 0.5 });
    this.loadingContainer.addChild(this.progressBarBg);
    
    this.progressBarFill = new Graphics();
    this.loadingContainer.addChild(this.progressBarFill);
    
    this.loadingText = new Text({
      text: "Loading 0%",
      style: new TextStyle({
        fontFamily: ['Quicksand', 'Be Vietnam Pro', 'sans-serif'],
        fill: 0xffffff,
        fontSize: 14,
        fontWeight: '700'
      })
    });
    this.loadingText.anchor.set(0.5);
    this.loadingText.position.set(0, -this.barHeight - 12);
    this.loadingContainer.addChild(this.loadingText);
    
    this.subText = new Text({
      text: "Tải tài nguyên...",
      style: new TextStyle({
        fontFamily: ['Quicksand', 'Be Vietnam Pro', 'sans-serif'],
        fill: 0xEDE7F6,
        fontSize: 12
      })
    });
    this.subText.anchor.set(0.5);
    this.subText.position.set(0, this.barHeight + 10);
    this.loadingContainer.addChild(this.subText);
    
    this.addChild(this.loadingContainer);
    
    this.playBtn.visible = false;
    this.lbBtn.visible = false;
    this.settingsBtn.visible = false;
    
    // Animation Ticker
    this.tickTime = 0;
    this.updateFn = this.onUpdate.bind(this);
    this.game.app.ticker.add(this.updateFn);

    this.on('destroyed', () => {
      this.game.app.ticker.remove(this.updateFn);
    });
    
    this.updateProgress(0, "Tải tài nguyên...");
    this.loadAssetsAndLogin();
  }



  onUpdate(ticker) {
    this.tickTime += ticker.deltaTime * 0.05;
    
    // Update fireflies
    const { width, height } = this.game.app.screen;
    if (this.fireflies) {
        for (const f of this.fireflies) {
            f.x += f.vx + Math.sin(this.tickTime * f.sinSpeed + f.sinOffset) * 0.7;
            f.y += f.vy;
            
            // Wrap around
            if (f.y < -10) f.y = height + 10;
            if (f.x < -10) f.x = width + 10;
            if (f.x > width + 10) f.x = -10;
        }
    }
    
    // Float title up and down
    if (this.titleContainer) {
        this.titleContainer.y = (this.game.app.screen.height * 0.28) + Math.sin(this.tickTime) * 10;
    }
    
    // Pulse Play Button
    if (this.playBtn && this.playBtn.visible && !this.lbModal && !this.settingsModal) {
        const scale = 1 + Math.sin(this.tickTime * 1.5) * 0.03;
        this.playBtn.scale.set(scale);
    } else if (this.playBtn) {
        this.playBtn.scale.set(1);
    }
  }

  updateProgress(ratio, text) {
    const p = Math.max(0, Math.min(1, ratio));
    this.progressBarFill.clear();
    if (p > 0) {
      const fillW = Math.max(10, (this.barWidth - 4) * p);
      this.progressBarFill.roundRect(-this.barWidth / 2 + 2, -this.barHeight / 2 + 2, fillW, this.barHeight - 4, 7)
        .fill(0x80CBC4); // Mint fill
    }
    this.loadingText.text = `Loading ${Math.round(p * 100)}%`;
    if (text) this.subText.text = text;
  }

  async loadAssetsAndLogin() {
    // 1. Tải Asset (0% -> 60%)
    this.updateProgress(0.05, "Tải tài nguyên...");
    await AssetManager.init((progress) => {
      this.updateProgress(0.05 + progress * 0.55, "Tải tài nguyên...");
    });
    
    // 2. Giả lập Đăng nhập API (60% -> 100%)
    const startTime = Date.now();
    const duration = 600; // 0.6s
    await new Promise(resolve => {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const ratio = Math.min(1, elapsed / duration);
        this.updateProgress(0.6 + ratio * 0.4, "Đăng nhập API (Google)...");
        if (ratio >= 1) {
          clearInterval(interval);
          resolve();
        }
      }, 30);
    });

    // Background handling (load and setup)
    const bgTexture = Assets.get('bg_menu');
    if (bgTexture) {
        if (!this.bgBlurredImage) {
            this.bgBlurredImage = new Sprite(bgTexture);
            this.bgBlurredImage.anchor.set(0.5);
            this.bgBlurredImage.filters = [new BlurFilter(15)];
            this.bgBlurredImage.tint = 0x888888;
            this.bgContainer.addChild(this.bgBlurredImage);
        }
        if (!this.bgImage) {
          this.bgImage = new Sprite(bgTexture);
          this.bgImage.anchor.set(0.5); // Anchor to center
          this.bgImage.tint = 0xdadada;
          this.bgContainer.addChild(this.bgImage);
          
          this.resize(this.game.app.screen.width, this.game.app.screen.height);
        }
    }

    // Complete: ẩn loading bar, hiện các nút UI
    this.loadingContainer.visible = false;
    this.playBtn.visible = true;
    this.lbBtn.visible = true;
    this.settingsBtn.visible = true;
  }
  
  resize(width, height) {
      // Resize Blurred Background (Always Cover)
      if (this.bgBlurredImage && this.bgBlurredImage.texture) {
          this.bgBlurredImage.scale.set(Math.max(width / this.bgBlurredImage.texture.width, height / this.bgBlurredImage.texture.height));
          this.bgBlurredImage.position.set(width / 2, height / 2);
      }
      
      // Resize Main Background (Contain on PC, Cover on Mobile)
      if (this.bgImage && this.bgImage.texture) {
          const isLandscape = width > height;
          const scale = isLandscape 
              ? Math.min(width / this.bgImage.texture.width, height / this.bgImage.texture.height)
              : Math.max(width / this.bgImage.texture.width, height / this.bgImage.texture.height);
          this.bgImage.scale.set(scale);
          this.bgImage.position.set(width / 2, height / 2);
      }
      
      // titleContainer's base Y is height * 0.28, which is recalculated in onUpdate
      if (this.titleContainer) {
          this.titleContainer.x = width / 2;
      }
      
      if (this.playBtn) this.playBtn.position.set(width / 2, height * 0.55);
      if (this.lbBtn) this.lbBtn.position.set(width / 2 - 50, height * 0.7);
      if (this.settingsBtn) this.settingsBtn.position.set(width / 2 + 50, height * 0.7);
      
      if (this.loadingContainer) {
          this.loadingContainer.position.set(width / 2, height * 0.78);
      }
      
      if (this.lbModal) this.lbModal.resize(width, height);
      if (this.settingsModal) this.settingsModal.resize(width, height);
  }
}
