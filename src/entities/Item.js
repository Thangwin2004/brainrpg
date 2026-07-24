import { Container, Sprite, Graphics, Text, TextStyle } from 'pixi.js';
import { AssetManager } from '../managers/AssetManager.js';
import gsap from 'gsap';

export class Item extends Container {
  constructor(power, type = 'add') {
    super();
    this.power = power;
    this.type = type;
    
    this.gridX = 0;
    this.gridY = 0;
    
    // Container for icon visuals
    this.icon = new Container();
    
    // Soft halo background behind the food item
    const haloColor = this.type === 'multiply' ? 0xFFB300 : 0x80CBC4;
    const halo = new Graphics()
      .circle(0, 0, 26)
      .fill({ color: haloColor, alpha: 0.2 });
    this.icon.addChild(halo);
    
    // Food / Drink Sprite (from master item assets)
    const texture = AssetManager.getRandomItemTexture();
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    
    const baseSize = Math.max(texture.width, texture.height);
    this.sprite.scale.set(54 / baseSize);
    this.icon.addChild(this.sprite);
    
    this.addChild(this.icon);
    
    // Drop shadow under item
    this.shadow = new Graphics()
      .ellipse(0, 28, 16, 5)
      .fill({ color: 0x000000, alpha: 0.25 });
    this.addChildAt(this.shadow, 0);

    // Power Badge (Top Right Pill - same style as monsters)
    const badgeStr = this.type === 'multiply' ? `x${this.power}` : `+${this.power}`;
    this.powerText = new Text({
      text: badgeStr,
      style: new TextStyle({
        fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
        fill: 0xffffff,
        fontSize: 11,
        fontWeight: '700'
      })
    });
    this.powerText.anchor.set(0.5);
    
    const tw = Math.max(26, this.powerText.width + 10);
    this.statsBg = new Graphics()
      .roundRect(30 - tw, -30, tw, 18, 9)
      .fill({ color: haloColor, alpha: 0.95 });
    this.addChild(this.statsBg);
    
    this.powerText.position.set(30 - tw / 2, -21);
    this.addChild(this.powerText);
    
    // Gentle floating animation
    this.idleTween = gsap.to(this.icon, {
      y: -6,
      duration: 1 + Math.random() * 0.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
  }
  
  collect() {
    this.idleTween.kill();
    gsap.to(this.scale, {
      x: 0,
      y: 0,
      duration: 0.2,
      ease: "back.in(2)",
      onComplete: () => {
        if (this.parent) this.parent.removeChild(this);
        this.destroy({ children: true });
      }
    });
  }
  
  destroy(options) {
    if (this.idleTween) this.idleTween.kill();
    if (this.icon) gsap.killTweensOf(this.icon);
    gsap.killTweensOf(this.scale);
    gsap.killTweensOf(this);
    super.destroy(options);
  }
}
