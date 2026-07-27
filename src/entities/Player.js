import { Container, Sprite, Text, TextStyle, Graphics, Assets } from 'pixi.js';
import { AssetManager, MAIN_CHAR_FILE } from '../managers/AssetManager.js';
import gsap from 'gsap';

export class Player extends Container {
  constructor() {
    super();
    this.power = 10;
    
    // Grid coordinates
    this.gridX = 0;
    this.gridY = 0;

    // Highlight Frame — Lavender (Lumina Play)
    this.frame = new Graphics()
      .roundRect(-32, -32, 64, 64, 14)
      .fill({ color: 0x7E57C2, alpha: 0.3 })
      .stroke({ color: 0xFFFFFF, width: 3 });
    this.addChild(this.frame);
    
    // Visuals
    const texture = AssetManager.getPlayerTexture();
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    
    // Scale avatar to fit nicely in grid cells
    const baseSize = Math.max(texture.width, texture.height);
    this.sprite.scale.set(58 / baseSize);
    this.addChild(this.sprite);
    
    // Drop shadow
    this.shadow = new Graphics()
      .ellipse(0, 28, 20, 6)
      .fill({ color: 0x000000, alpha: 0.2 });
    this.addChildAt(this.shadow, 1);

    // Power Badge (Top Right Pill — Lavender)
    this.statsBg = new Graphics()
      .roundRect(8, -32, 26, 18, 9)
      .fill({ color: 0x7E57C2, alpha: 0.95 });
    this.addChild(this.statsBg);

    this.powerText = new Text({
      text: `${this.power}`,
      style: new TextStyle({ fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif", fill: 0xffffff, fontSize: 11, fontWeight: '700' })
    });
    this.powerText.anchor.set(0.5);
    this.powerText.position.set(21, -23);
    this.addChild(this.powerText);
  }

  updatePowerBadge() {
    this.powerText.text = `${this.power}`;
    const tw = Math.max(26, this.powerText.width + 10);
    this.statsBg.clear()
      .roundRect(32 - tw, -32, tw, 18, 9)
      .fill({ color: 0x7E57C2, alpha: 0.95 });
    this.powerText.position.set(32 - tw / 2, -23);
  }
  
  async moveTo(worldX, worldY) {
    return new Promise(resolve => {
      gsap.to(this.position, {
        x: worldX,
        y: worldY,
        duration: 0.15,
        ease: "power1.inOut",
        onComplete: resolve
      });
      // Small hop
      gsap.to(this.sprite, {
        y: -10,
        yoyo: true,
        repeat: 1,
        duration: 0.075
      });
    });
  }
  
  async bump(direction, worldX, worldY) {
    const bumpDist = 20;
    let targetX = this.position.x;
    let targetY = this.position.y;
    
    if (direction === 'up') targetY -= bumpDist;
    if (direction === 'down') targetY += bumpDist;
    if (direction === 'left') targetX -= bumpDist;
    if (direction === 'right') targetX += bumpDist;
    
    return new Promise(resolve => {
      gsap.to(this.position, {
        x: targetX,
        y: targetY,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        onComplete: resolve
      });
    });
  }
  
  absorbPower(amount) {
    this.power += amount;
    this.updatePowerBadge();
    
    // Flash green
    this.sprite.tint = 0x00ff00;
    setTimeout(() => {
      if (!this.destroyed) this.sprite.tint = 0xffffff;
    }, 150);
    
    // Screen shake or wobble
    gsap.to(this.sprite, {
      y: -15,
      yoyo: true,
      repeat: 1,
      duration: 0.1,
      onComplete: () => {
        if (!this.destroyed) this.sprite.y = 0;
      }
    });
    
    this.showFloatingText(`+${amount}`, 0x00ff00);
  }
  
  spendPower(amount) {
    this.power -= amount;
    this.updatePowerBadge();
    
    // Flash orange-red
    this.sprite.tint = 0xff6644;
    setTimeout(() => {
      if (!this.destroyed) this.sprite.tint = 0xffffff;
    }, 200);
    
    gsap.to(this.sprite, {
      y: -8,
      yoyo: true,
      repeat: 1,
      duration: 0.08,
      onComplete: () => {
        if (!this.destroyed) this.sprite.y = 0;
      }
    });
    
    this.showFloatingText(`-${amount}`, 0xff4444);
  }
  
  multiplyPower(amount) {
    this.power = Math.floor(this.power * amount);
    this.updatePowerBadge();
    
    // Flash yellow/gold
    this.sprite.tint = 0xffd700;
    setTimeout(() => {
      if (!this.destroyed) this.sprite.tint = 0xffffff;
    }, 150);
    
    gsap.to(this.sprite, {
      y: -20,
      scale: 1.2,
      yoyo: true,
      repeat: 1,
      duration: 0.15,
      onComplete: () => {
        if (!this.destroyed) {
            this.sprite.y = 0;
            const baseSize = Math.max(AssetManager.getPlayerTexture().width, AssetManager.getPlayerTexture().height);
            this.sprite.scale.set(58 / baseSize);
        }
      }
    });
    
    this.showFloatingText(`x${amount}`, 0xffd700);
  }
  
  resetPower(val = 10) {
      this.power = val;
      this.updatePowerBadge();
      this.sprite.tint = 0xffffff;
      this.sprite.rotation = 0;
      this.sprite.y = 0;
  }
  
  die() {
    // Just a small hurt shake when defeated, before the revive modal
    gsap.to(this.sprite, {
      x: (Math.random() > 0.5 ? 10 : -10),
      yoyo: true,
      repeat: 5,
      duration: 0.05
    });
  }
  
  kickOut(onCompleteCallback) {
    try {
        const kickedTextureId = MAIN_CHAR_FILE.replace('.png', '_kicked.png');
        const kickedTexture = Assets.get(kickedTextureId);
        if (kickedTexture) {
            this.sprite.texture = kickedTexture;
        }
    } catch (e) {
        console.error("Failed to load kicked texture:", e);
    }

    // Kicked from left, flying straight into the screen (camera)
    gsap.to(this.sprite, {
      y: -200, // Fly up
      x: 150,  // Fly right
      rotation: -0.15, // Slight tilt
      duration: 0.5,
      ease: "power2.in",
      onComplete: onCompleteCallback
    });
    
    // Scale up to simulate Z-axis flying into the screen (moderate size)
    gsap.to(this.sprite.scale, {
      x: this.sprite.scale.x * 3.5, 
      y: this.sprite.scale.y * 3.5, 
      duration: 0.5, 
      ease: "power2.in"
    });
  }
  
  showFloatingText(msg, color) {
    const txt = new Text({
      text: msg,
      style: new TextStyle({ fontFamily: "'Be Vietnam Pro', sans-serif", fill: color, fontSize: 24, fontWeight: '900', stroke: {color: 0xffffff, width: 4} })
    });
    txt.anchor.set(0.5);
    txt.position.set(0, -30);
    this.addChild(txt);
    
    gsap.to(txt, {
      y: -80,
      alpha: 0,
      duration: 1,
      onComplete: () => {
        if (!txt.destroyed) txt.destroy();
      }
    });
  }
}
