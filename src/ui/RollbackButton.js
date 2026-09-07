import { Container, Graphics, Text, Rectangle } from 'pixi.js';
import { AudioManager } from '../managers/AudioManager.js';
import { rollbackPresentation } from '../core/rollbackState.js';

export class RollbackButton extends Container {
    constructor(onClick) {
        super();
        this.hitArea = new Rectangle(-72, -22, 144, 48);
        this.interactiveChildren = false;
        this.content = new Container();
        this.addChild(this.content);
        this.base = new Graphics();
        this.face = new Graphics();
        this.badge = new Graphics();
        this.arrow = new Graphics().svg('<svg viewBox="0 0 24 24"><path fill="#ffffff" d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C20.89 11.12 17.03 8 12.5 8z"/></svg>');
        this.arrow.pivot.set(12, 12);
        this.arrow.scale.set(0.75);
        this.arrow.position.set(-46, -1);
        const style = { fontFamily: ['Be Vietnam Pro', 'sans-serif'], fill: 0xffffff, fontWeight: '800' };
        this.title = new Text({ text: '', style: { ...style, fontSize: 13, letterSpacing: 0.5 } });
        this.title.anchor.set(0, 0.5);
        this.title.position.set(-32, -1);
        this.detail = new Text({ text: '', style: { ...style, fontSize: 11, fontWeight: '500' } });
        this.detail.visible = false; // Keep for data/test inspection, hide from visual clutter
        this.countText = new Text({ text: '', style: { ...style, fontSize: 12, fontWeight: '900' } });
        this.countText.anchor.set(0.5);
        this.countText.position.set(46, -1);
        this.content.addChild(this.base, this.face, this.arrow, this.title, this.detail, this.badge, this.countText);
        const release = () => { this.pressedPointer = null; this.content.y = 0; };
        this.on('pointerdown', event => {
            event.stopPropagation();
            if (!this.presentation.enabled || this.pressedPointer != null || event.button !== 0) return;
            this.pressedPointer = event.pointerId;
            this.content.y = 3;
        });
        this.on('pointerup', event => {
            event.stopPropagation();
            const activate = this.presentation.enabled && this.pressedPointer === event.pointerId;
            release();
            if (activate) {
                AudioManager.playClickSFX();
                onClick();
            }
        });
        this.on('pointerupoutside', release);
        this.on('pointercancel', release);
        this.on('pointerout', release);
        this.on('pointerover', () => { if (this.presentation.enabled) this.face.tint = 0xF3EDFF; });
        this.on('pointerout', () => { this.face.tint = 0xffffff; });
        this.setState({ count: 3, historySize: 0 });
    }

    setState(state) {
        const next = rollbackPresentation(state);
        const key = JSON.stringify(next);
        if (key === this.stateKey) return;
        this.stateKey = key;
        this.presentation = next;
        this.pressedPointer = null;
        this.content.y = 0;
        this.face.tint = 0xffffff;
        // Disabled stays opaque and readable; static hit testing consumes UI gestures.
        this.eventMode = 'static';
        this.cursor = next.enabled ? 'pointer' : 'default';
        this.alpha = next.enabled ? 1.0 : 0.6;
        const active = next.enabled || next.mode === 'busy';
        const fill = active ? (next.mode === 'ad' ? 0x166B91 : 0x7351B5) : 0xE6E0ED;
        const ink = active ? 0xffffff : 0x675D77;
        this.base.clear().roundRect(-72, -18, 144, 44, 22).fill(active ? 0x493473 : 0xABA1BA);
        this.face.clear().roundRect(-72, -22, 144, 44, 22).fill(fill).stroke({ color: 0xffffff, width: 2.5 });
        this.badge.clear().roundRect(32, -12, 28, 24, 12).fill(active ? 0xffffff : 0xD5CCDF);
        this.title.text = next.title;
        this.detail.text = next.detail;
        this.countText.text = next.badge;
        this.title.style.fill = ink;
        this.detail.style.fill = ink;
        this.arrow.tint = ink;
        this.countText.style.fill = active ? 0x493473 : 0x675D77;
    }
}
