import { Rectangle } from 'pixi.js';

export class SwipeManager {
  constructor(app, onSwipe) {
    this.app = app;
    this.onSwipe = onSwipe; // Callback function(direction: 'up' | 'down' | 'left' | 'right')
    
    this.startX = 0;
    this.startY = 0;
    this.isSwiping = false;
    
    // Attach to the interactive stage
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = new Rectangle(0, 0, 10000, 10000); // Big enough to catch all
    
    this.app.stage.on('pointerdown', this.onPointerDown.bind(this));
    this.app.stage.on('pointerup', this.onPointerUp.bind(this));
    this.app.stage.on('pointerupoutside', this.onPointerUp.bind(this));
  }
  
  onPointerDown(e) {
    this.startX = e.global.x;
    this.startY = e.global.y;
    this.isSwiping = true;
  }
  
  onPointerUp(e) {
    if (!this.isSwiping) return;
    this.isSwiping = false;
    
    const endX = e.global.x;
    const endY = e.global.y;
    
    const diffX = endX - this.startX;
    const diffY = endY - this.startY;
    
    const threshold = 30; // Minimum pixel distance to be considered a swipe
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) this.onSwipe('right');
        else this.onSwipe('left');
      }
    } else {
      if (Math.abs(diffY) > threshold) {
        if (diffY > 0) this.onSwipe('down');
        else this.onSwipe('up');
      }
    }
  }
  
  destroy() {
    this.app.stage.off('pointerdown', this.onPointerDown.bind(this));
    this.app.stage.off('pointerup', this.onPointerUp.bind(this));
    this.app.stage.off('pointerupoutside', this.onPointerUp.bind(this));
  }
}
