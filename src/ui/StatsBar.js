import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { IconBtn } from './Button.js';

export class StatsBar extends Container {
  constructor(width, onOpenSettings) {
    super();

    // ── Shared style constants ──
    this._pad = 12;      // horizontal edge padding
    this._gap = 8;       // gap between row 1 and row 2
    this._pillH = 44;    // pill height for both rows
    this._pillR = 22;    // pill border-radius
    this._btnSize = 24;  // icon button size

    // ═══════════════════════════════════════
    // ROW 1: Floor pill (left) + buttons (right)
    // ═══════════════════════════════════════

    // 1a. Floor Pill
    this.floorContainer = new Container();
    this.floorBg = new Graphics();
    this.floorContainer.addChild(this.floorBg);

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
    this.floorContainer.addChild(this.floorText);
    this.addChild(this.floorContainer);

    // 1b. Settings Button
    const settingsSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#7E57C2" d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`;
    this.settingsBtn = new IconBtn(settingsSvg, () => {
      if (onOpenSettings) onOpenSettings();
    }, this._btnSize, '#EDE7F6', '#D1C4E9', '#B39DDB');
    this.addChild(this.settingsBtn);

    // 1c. Rollback Button
    const undoSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#7E57C2" d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C20.89 11.12 17.03 8 12.5 8z"/></svg>`;
    this.rollbackBtn = new IconBtn(undoSvg, () => {
      if (this.onRollback) this.onRollback();
    }, this._btnSize, '#EDE7F6', '#D1C4E9', '#B39DDB');
    this.addChild(this.rollbackBtn);

    // 1d. Rollback Badge
    this.rollbackBadgeBg = new Graphics()
      .circle(0, 0, 9)
      .fill({ color: 0xE53935 });
    this.addChild(this.rollbackBadgeBg);

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
    this.addChild(this.rollbackBadgeText);

    // ═══════════════════════════════════════
    // ROW 2: Power pill (centered)
    // ═══════════════════════════════════════
    this.powerContainer = new Container();

    this.powerBg = new Graphics();
    this.powerContainer.addChild(this.powerBg);

    // Group icon + text together for easy centering
    this.powerGroup = new Container();

    const lightningSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#7E57C2" d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`;
    this.lightningIcon = new Graphics().svg(lightningSvg);
    this.lightningIcon.pivot.set(12, 12);
    this.lightningIcon.scale.set(1.3);
    this.lightningIcon.position.set(0, 0);
    this.powerGroup.addChild(this.lightningIcon);

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
    this.powerText.position.set(18, 0);
    this.powerGroup.addChild(this.powerText);

    this.powerContainer.addChild(this.powerGroup);
    this.addChild(this.powerContainer);

    // ── Total height (reported to GameScene) ──
    this.totalHeight = 0;

    // Initial layout
    this.resize(width);
  }

  /**
   * Recalculate all positions based on current screen width.
   * Call this from GameScene.resize(w, h).
   */
  resize(width) {
    const pad = this._pad;
    const gap = this._gap;
    const pillH = this._pillH;
    const pillR = this._pillR;

    // ── ROW 1 ──
    const row1Y = pad;
    const row1CenterY = row1Y + pillH / 2;

    // Floor pill — left
    const floorW = 130;
    this.floorBg.clear()
      .roundRect(0, 0, floorW, pillH, pillR)
      .fill({ color: 0xffffff, alpha: 0.85 });
    this.floorContainer.position.set(pad, row1Y);
    this.floorText.position.set(floorW / 2, pillH / 2);

    // Settings button — right edge
    this.settingsBtn.position.set(width - pad - 20, row1CenterY);

    // Rollback button — to the left of settings
    this.rollbackBtn.position.set(width - pad - 20 - 55, row1CenterY);

    // Badge — top-right of rollback button
    const badgeX = width - pad - 20 - 55 + 20;
    const badgeY = row1CenterY - 20;
    this.rollbackBadgeBg.position.set(badgeX, badgeY);
    this.rollbackBadgeText.position.set(badgeX, badgeY);

    // ── ROW 2 ──
    const row2Y = row1Y + pillH + gap;
    const row2CenterY = row2Y + pillH / 2;

    // Power pill — centered, width adapts to screen
    const powerW = Math.min(width - pad * 2, 300);
    this.powerBg.clear()
      .roundRect(-powerW / 2, -pillH / 2, powerW, pillH, pillR)
      .fill({ color: 0xffffff, alpha: 0.85 });
    this.powerContainer.position.set(width / 2, row2CenterY);

    // Center icon+text group inside pill
    this.powerGroup.position.set(0, 0);

    // ── Report total height ──
    this.totalHeight = row2Y + pillH + gap;
  }

  updateStats(floor, power) {
    this.floorText.text = `TẦNG ${floor}`;
    this.powerText.text = `NĂNG LƯỢNG: ${power}`;

    // Re-center group dynamically based on text width
    const groupW = 18 + this.powerText.width; // icon gap + text
    this.powerGroup.position.x = -groupW / 2;
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
