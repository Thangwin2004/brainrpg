import { Container, Sprite, Text, TextStyle, Graphics } from 'pixi.js';
import { AssetManager } from '../managers/AssetManager.js';
import gsap from 'gsap';

export class Monster extends Container {
  constructor(power, isBoss = false) {
    super();
    
    this.power = power;
    this.isBoss = isBoss;
    
    this.gridX = 0;
    this.gridY = 0;
    
    // Visuals
    const texture = AssetManager.getRandomMonsterTexture();
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    
    const baseSize = Math.max(texture.width, texture.height);
    let scaleVal = 65 / baseSize;
    if (this.isBoss) {
      scaleVal *= 1.5; // Bosses are 50% larger
      this.sprite.tint = 0xffaaaa; // Slightly red tint for boss
    }
    this.sprite.scale.set(scaleVal);
    
    // Boss Aura
    if (this.isBoss) {
      this.aura = new Graphics()
        .circle(0, 0, 45)
        .fill({ color: 0xFF8A80, alpha: 0.2 });
      this.addChild(this.aura);
      
      gsap.to(this.aura.scale, {
        x: 1.2,
        y: 1.2,
        duration: 1,
        yoyo: true,
        repeat: -1
      });
    }

    this.addChild(this.sprite);
    
    // Drop shadow
    this.shadow = new Graphics()
      .ellipse(0, this.isBoss ? 50 : 35, this.isBoss ? 30 : 20, this.isBoss ? 10 : 6)
      .fill({ color: 0x000000, alpha: 0.3 });
    this.addChildAt(this.shadow, 0);
    
    // Stats UI (Power Badge - Top Right Pill)
    this.powerText = new Text({
      text: `${this.power}`, 
      style: new TextStyle({ fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif", fill: 0xffffff, fontSize: 11, fontWeight: '700' })
    });
    this.powerText.anchor.set(0.5);
    
    const tw = Math.max(24, this.powerText.width + 10);
    this.statsBg = new Graphics()
      .roundRect(30 - tw, -30, tw, 18, 9)
      .fill({ color: this.isBoss ? 0xFF8A80 : 0x7E57C2, alpha: 0.9 });
    this.addChild(this.statsBg);
    
    this.powerText.position.set(30 - tw / 2, -21);
    this.addChild(this.powerText);
    
    // Idle animation
    this.idleTween = gsap.to(this.sprite.scale, {
      y: this.sprite.scale.y * 0.9,
      x: this.sprite.scale.x * 1.05,
      duration: 0.8 + Math.random() * 0.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
  }
  
  die() {
    this.idleTween.kill();
    gsap.to(this, {
      alpha: 0,
      scale: 0.1,
      rotation: Math.PI,
      duration: 0.3,
      ease: "back.in(2)",
      onComplete: () => {
        if (this.parent) this.parent.removeChild(this);
        this.destroy({ children: true });
      }
    });
  }
  
  destroy(options) {
    if (this.idleTween) this.idleTween.kill();
    if (this.sprite) gsap.killTweensOf(this.sprite.scale);
    if (this.aura) gsap.killTweensOf(this.aura.scale);
    gsap.killTweensOf(this);
    super.destroy(options);
  }
}
