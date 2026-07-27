import { Container, Graphics, FillGradient, Text, TextStyle } from 'pixi.js';
import { AudioManager } from '../managers/AudioManager.js';

export class IconBtn extends Container {
  constructor(iconSvgString, onClick, currentR = 35, colorTop, colorBot, colorShadow) {
    super();
    this.content = new Container();
    this.addChild(this.content);

    const shadow = new Graphics();
    const bg = new Graphics();

    // 1. Shadow (offset down)
    shadow.circle(0, currentR * 0.15, currentR).fill({ color: colorShadow });

    // 2. Main Background
    const btnGrad = new FillGradient(0, -currentR, 0, currentR);
    btnGrad.addColorStop(0, colorTop);
    btnGrad.addColorStop(1, colorBot);
    
    bg.circle(0, 0, currentR)
      .fill(btnGrad)
      .stroke({ width: Math.max(3, currentR * 0.15), color: 0xFFFFFF });

    this.content.addChild(shadow, bg);

    // 3. SVG Icon (viewBox 24x24)
    if (iconSvgString) {
      const icon = new Graphics();
      icon.svg(iconSvgString);
      icon.pivot.set(12, 12); 
      icon.scale.set((currentR * 1.2) / 24);
      icon.y = 0;
      this.content.addChild(icon);
    }

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerdown', () => { 
      AudioManager.playClickSFX();
      this.scale.set(0.95); 
      this.content.y = currentR * 0.1; 
    });
    this.on('pointerup', () => { this.scale.set(1); this.content.y = 0; if (onClick) onClick(); });
    this.on('pointerupoutside', () => { this.scale.set(1); this.content.y = 0; });
  }
}

export class CapsuleBtn extends Container {
  constructor(textStr, onClick, width = 220, height = 48, colorTop = '#FFF176', colorBot = '#FBC02D', colorShadow = '#F57F17') {
    super();
    this.content = new Container();
    this.addChild(this.content);

    const shadow = new Graphics();
    const bg = new Graphics();
    const radius = height / 2;

    // 1. Shadow (offset down)
    shadow.roundRect(-width / 2, -height / 2 + 5, width, height, radius).fill({ color: colorShadow });

    // 2. Main Background
    const btnGrad = new FillGradient(0, -height / 2, 0, height / 2);
    btnGrad.addColorStop(0, colorTop);
    btnGrad.addColorStop(1, colorBot);
    
    bg.roundRect(-width / 2, -height / 2, width, height, radius)
      .fill(btnGrad)
      .stroke({ width: 3.5, color: 0xFFFFFF });

    this.content.addChild(shadow, bg);

    // 3. Text
    const label = new Text({
      text: textStr,
      style: new TextStyle({
        fontFamily: ['Be Vietnam Pro', 'sans-serif'],
        fontSize: 17,
        fontWeight: '900',
        fill: 0xFFFFFF,
        dropShadow: { color: 0x000000, alpha: 0.3, blur: 2, distance: 2 }
      })
    });
    label.anchor.set(0.5);
    this.content.addChild(label);

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerdown', () => { 
      AudioManager.playClickSFX();
      this.scale.set(0.95); 
      this.content.y = 4; 
    });
    this.on('pointerup', () => { this.scale.set(1); this.content.y = 0; if (onClick) onClick(); });
    this.on('pointerupoutside', () => { this.scale.set(1); this.content.y = 0; });
  }
}
