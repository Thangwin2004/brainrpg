import { Rectangle } from 'pixi.js';

export class SwipeManager {
  constructor(app, onSwipe, { canStart = () => true, contains = () => true } = {}) {
    this.app = app;
    this.onSwipe = onSwipe; // Callback function(direction: 'up' | 'down' | 'left' | 'right')
    this.canStart = canStart;
    this.contains = contains;
    
    this.startX = 0;
    this.startY = 0;
    this.isSwiping = false;
    
    // Attach to the interactive stage
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = new Rectangle(0, 0, 10000, 10000); // Big enough to catch all
    
    this._onPointerDown = this.onPointerDown.bind(this);
    this._onPointerUp = this.onPointerUp.bind(this);
    this._onCancel = () => { this.isSwiping = false; };
    this._onKeyDown = e => {
      const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
      if (!direction || e.repeat || e.ctrlKey || e.metaKey || e.altKey || !this.canStart()) return;
      if (e.target?.closest?.('input, textarea, select, button, [contenteditable="true"]')) return;
      e.preventDefault();
      this.onSwipe(direction);
    };
    
    this.app.stage.on('pointerdown', this._onPointerDown);
    this.app.stage.on('pointerup', this._onPointerUp);
    this.app.stage.on('pointerupoutside', this._onPointerUp);
    this.app.stage.on('pointercancel', this._onCancel);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('blur', this._onCancel);
  }
  
  onPointerDown(e) {
    if (this.isSwiping || !this.canStart() || !this.contains(e.global) || (e.button != null && e.button !== 0)) return;
    this.pointerId = e.pointerId;
    this.startX = e.global.x;
    this.startY = e.global.y;
    this.isSwiping = true;
  }
  
  onPointerUp(e) {
    if (!this.isSwiping || e.pointerId !== this.pointerId) return;
    this.isSwiping = false;
    if (!this.canStart()) return;
    
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
    this.app.stage.off('pointerdown', this._onPointerDown);
    this.app.stage.off('pointerup', this._onPointerUp);
    this.app.stage.off('pointerupoutside', this._onPointerUp);
    this.app.stage.off('pointercancel', this._onCancel);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('blur', this._onCancel);
  }
}
