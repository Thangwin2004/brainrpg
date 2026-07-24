import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { IconBtn } from './Button.js';

export class StatsBar extends Container {
  constructor(width, onOpenSettings) {
    super();

    // 1. Floor Pill — White semi-transparent on lavender bg
    this.floorContainer = new Container();
    this.floorContainer.position.set(20, 20);

    const floorBg = new Graphics()
      .roundRect(0, 0, 130, 44, 22)
      .fill({ color: 0xffffff, alpha: 0.85 });

    this.floorContainer.addChild(floorBg);

    this.floorText = new Text({
      text: "TẦNG 1",
      style: new TextStyle({
        fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
        fill: 0x453268,
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5
      })
    });
    this.floorText.anchor.set(0.5);
    this.floorText.position.set(65, 22);
    this.floorContainer.addChild(this.floorText);
    this.addChild(this.floorContainer);

    // 2. Power Pill — White capsule with lavender icon
    this.powerContainer = new Container();
    const powerW = Math.max(240, Math.min(width * 0.55, 270));
    this.powerContainer.position.set(width / 2, 17); // Aligned with other header elements

    this.powerBg = new Graphics()
      .roundRect(-powerW / 2, 0, powerW, 50, 25)
      .fill({ color: 0xffffff, alpha: 0.85 });
    this.powerContainer.addChild(this.powerBg);

    // Group for centering
    this.powerGroup = new Container();

    // Lavender Lightning Icon
    const lightningSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#7E57C2" d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`;
    this.lightningIcon = new Graphics().svg(lightningSvg);
    this.lightningIcon.pivot.set(12, 12);
    this.lightningIcon.scale.set(1.3);
    this.lightningIcon.position.set(0, 0);
    this.powerGroup.addChild(this.lightningIcon);

    // Power Text — deep lavender
    this.powerText = new Text({
      text: "NĂNG LƯỢNG: 10",
      style: new TextStyle({
        fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
        fill: 0x453268,
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 1
      })
    });
    this.powerText.anchor.set(0, 0.5);
    this.powerText.position.set(16, 0); // 16px to the right of icon center
    this.powerGroup.addChild(this.powerText);
    
    this.powerContainer.addChild(this.powerGroup);

    this.addChild(this.powerContainer);

    // 3. Settings Button — soft lavender circle
    const settingsSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#7E57C2" d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`;
    this.settingsBtn = new IconBtn(settingsSvg, () => {
      if (onOpenSettings) onOpenSettings();
    }, 24, '#EDE7F6', '#D1C4E9', '#B39DDB');
    this.settingsBtn.position.set(width - 45, 42);
    this.addChild(this.settingsBtn);

    // 4. Rollback Button
    const undoSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#7E57C2" d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C20.89 11.12 17.03 8 12.5 8z"/></svg>`;
    this.rollbackBtn = new IconBtn(undoSvg, () => {
      if (this.onRollback) this.onRollback();
    }, 24, '#EDE7F6', '#D1C4E9', '#B39DDB');
    this.rollbackBtn.position.set(width - 100, 42);
    this.addChild(this.rollbackBtn);

    // Badge position (absolute on StatsBar)
    this._badgeAbsX = width - 100 + 20;
    this._badgeAbsY = 42 - 20;

    // Red circle badge background — direct child of StatsBar
    this.rollbackBadgeBg = new Graphics()
      .circle(0, 0, 9)
      .fill({ color: 0xE53935 });
    this.rollbackBadgeBg.position.set(this._badgeAbsX, this._badgeAbsY);
    this.addChild(this.rollbackBadgeBg);

    // Badge number — use large fontSize + scale down to fix PixiJS small text re-render bug
    this.rollbackBadgeText = new Text({
      text: '3',
      style: new TextStyle({
        fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
        fill: 0xffffff,
        fontSize: 22,
        fontWeight: '700'
      })
    });
    this.rollbackBadgeText.anchor.set(0.5);
    this.rollbackBadgeText.scale.set(0.5);
    this.rollbackBadgeText.position.set(this._badgeAbsX, this._badgeAbsY);
    this.addChild(this.rollbackBadgeText);
  }

  resize(width) {
    // 1. Power Pill
    const powerW = Math.max(240, Math.min(width * 0.55, 270));
    this.powerContainer.position.set(width / 2, 17);
    
    this.powerBg.clear()
      .roundRect(-powerW / 2, 0, powerW, 50, 25)
      .fill({ color: 0xffffff, alpha: 0.85 });
      
    this.powerGroup.position.set(0, 25);

    // 2. Buttons
    this.settingsBtn.position.set(width - 45, 42);
    this.rollbackBtn.position.set(width - 100, 42);

    // 3. Rollback Badge
    this._badgeAbsX = width - 100 + 20;
    this._badgeAbsY = 42 - 20;
    this.rollbackBadgeBg.position.set(this._badgeAbsX, this._badgeAbsY);
    this.rollbackBadgeText.position.set(this._badgeAbsX, this._badgeAbsY);
  }

  updateStats(floor, power) {
    this.floorText.text = `TẦNG ${floor}`;
    this.powerText.text = `NĂNG LƯỢNG: ${power}`;
    
    // Center the group dynamically based on text width
    this.powerGroup.position.x = -this.powerText.width / 2;
  }

  forceUpdateRollbacks(count, canRollback) {
    // Update badge circle color
    this.rollbackBadgeBg.clear();
    const badgeColor = count <= 0 ? 0x9E9E9E : 0xE53935;
    this.rollbackBadgeBg.circle(0, 0, 9).fill({ color: badgeColor });

    // Update badge text
    this.rollbackBadgeText.text = count <= 0 ? '+' : String(count);

    // Enable/disable button
    if (canRollback) {
      this.rollbackBtn.alpha = 1;
      this.rollbackBtn.interactive = true;
    } else {
      this.rollbackBtn.alpha = 0.5;
      this.rollbackBtn.interactive = false;
    }
  }
}
