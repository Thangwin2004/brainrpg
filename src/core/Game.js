import { Application, Ticker } from 'pixi.js';
import { MenuScene } from '../scenes/MenuScene.js';

export class Game {
  constructor() {
    this.app = new Application();
    this.currentScene = null;
  }

  async init() {
    await this.app.init({
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      backgroundColor: 0x1a1a2e, // Dark deep blue/purple base
      preference: 'webgl',
      resizeTo: window
    });

    document.getElementById('game-container').appendChild(this.app.canvas);

    // 2. Prevent default touch behaviors (like pinch zoom or pull-to-refresh)
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    
    // 3. Load Assets (To be implemented later)
    // await AssetManager.init();

    // 4. Start Render Loop
    Ticker.shared.add(this.update.bind(this));
    
    // 5. Handle Resize
    window.addEventListener('resize', this.onResize.bind(this));
    
    // 6. Load Initial Scene
    this.setScene(new MenuScene());
  }

  onResize() {
    if (this.currentScene && typeof this.currentScene.resize === 'function') {
      this.currentScene.resize(window.innerWidth, window.innerHeight);
    }
  }

  setScene(newScene) {
    if (this.currentScene) {
      this.app.stage.removeChild(this.currentScene);
      if (this.currentScene.destroy) {
        this.currentScene.destroy({ children: true });
      }
    }
    
    this.currentScene = newScene;
    if (this.currentScene) {
      this.app.stage.addChild(this.currentScene);
      if (this.currentScene.init) {
        this.currentScene.init(this);
      }
      // Force an immediate resize to ensure layout is perfect on load
      this.onResize();
    }
  }

  update(ticker) {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(ticker.deltaMS);
    }
  }
}
