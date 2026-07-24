import { Container, Graphics, Text, TextStyle, FillGradient } from 'pixi.js';
import { IconBtn } from '../ui/Button.js';
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
    
    // Background — Lumina Play Lavender Gradient
    const bgGrad = new FillGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#B39DDB');
    bgGrad.addColorStop(1, '#7E57C2');
    
    this.bg = new Graphics().rect(0, 0, width, height).fill(bgGrad);
    this.addChild(this.bg);
    
    // Title — White bold on lavender
    this.titleText = new Text({
      text: "HÀNH TRÌNH\nBỘ LẠC",
      style: new TextStyle({ 
        fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif", 
        fill: 0xFFFFFF, 
        fontSize: 48, 
        fontWeight: '700', 
        align: 'center',
        dropShadow: { color: 0x4A148C, alpha: 0.35, blur: 6, distance: 3 }
      })
    });
    this.titleText.anchor.set(0.5);
    this.titleText.position.set(width / 2, height * 0.3);
    this.addChild(this.titleText);
    
    // Play Button — Coral Accent (primary CTA)
    const playSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M8 5v14l11-7z"/></svg>`;
    this.playBtn = new IconBtn(playSvg, () => {
      AudioManager.playBGM();
      this.game.setScene(new GameScene());
    }, 45, '#FF8A80', '#E57373', '#D32F2F');
    this.playBtn.position.set(width / 2, height * 0.55);
    this.addChild(this.playBtn);
    
    // Leaderboard Button — Lavender (same family)
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
    }, 35, '#CE93D8', '#AB47BC', '#7B1FA2');
    this.lbBtn.position.set(width / 2 - 60, height * 0.7);
    this.addChild(this.lbBtn);

    // Settings Button — Mint Secondary
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
    }, 35, '#80CBC4', '#4DB6AC', '#00897B');
    this.settingsBtn.position.set(width / 2 + 60, height * 0.7);
    this.addChild(this.settingsBtn);
    
    // Loading Progress Bar Container
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
        fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
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
        fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
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
    
    this.updateProgress(0, "Tải tài nguyên...");
    this.loadAssetsAndLogin();
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

    // Complete: ẩn loading bar, hiện các nút UI
    this.loadingContainer.visible = false;
    this.playBtn.visible = true;
    this.lbBtn.visible = true;
    this.settingsBtn.visible = true;
  }
  
  resize(width, height) {
      if (this.bg) {
        const bgGrad = new FillGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#B39DDB');
        bgGrad.addColorStop(1, '#7E57C2');
        this.bg.clear().rect(0, 0, width, height).fill(bgGrad);
      }
      
      if (this.titleText) this.titleText.position.set(width / 2, height * 0.3);
      if (this.playBtn) this.playBtn.position.set(width / 2, height * 0.55);
      if (this.lbBtn) this.lbBtn.position.set(width / 2 - 60, height * 0.7);
      if (this.settingsBtn) this.settingsBtn.position.set(width / 2 + 60, height * 0.7);
      
      if (this.loadingContainer) {
          this.loadingContainer.position.set(width / 2, height * 0.78);
      }
      if (this.lbModal) this.lbModal.resize(width, height);
      if (this.settingsModal) this.settingsModal.resize(width, height);
  }
}
