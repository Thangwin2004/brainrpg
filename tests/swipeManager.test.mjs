import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { SwipeManager } from '../src/managers/SwipeManager.js';

test('swipes require a board start, match one pointer and stop at modal/cancel boundaries', () => {
    const listeners = new Map();
    globalThis.window = {
        addEventListener: (name, fn) => listeners.set(name, fn),
        removeEventListener: name => listeners.delete(name),
    };
    let enabled = true;
    const moves = [];
    const stage = new EventEmitter();
    const manager = new SwipeManager({ stage }, move => moves.push(move), {
        canStart: () => enabled,
        contains: ({ x, y }) => x >= 100 && y >= 100,
    });
    const point = (x, y, pointerId = 1) => ({ global: { x, y }, pointerId, button: 0 });
    try {
        stage.emit('pointerdown', point(0, 0));
        stage.emit('pointerup', point(200, 200));
        assert.deepEqual(moves, []);
        stage.emit('pointerdown', point(150, 150));
        stage.emit('pointerdown', point(300, 300, 2));
        stage.emit('pointerup', point(300, 400, 2));
        stage.emit('pointerup', point(200, 150));
        assert.deepEqual(moves, ['right']);
        stage.emit('pointerdown', point(150, 150));
        stage.emit('pointercancel');
        stage.emit('pointerup', point(150, 250));
        enabled = false;
        stage.emit('pointerdown', point(150, 150));
        enabled = true;
        stage.emit('pointerup', point(150, 250));
        stage.emit('pointerdown', point(150, 150));
        enabled = false;
        stage.emit('pointerup', point(150, 250));
        assert.deepEqual(moves, ['right']);
        enabled = true;
        stage.emit('pointerdown', point(150, 150));
        stage.emit('pointerup', point(155, 155));
        assert.deepEqual(moves, ['right']);
        let prevented = false;
        listeners.get('keydown')({ key: 'ArrowUp', preventDefault: () => { prevented = true; } });
        listeners.get('keydown')({ key: 'ArrowUp', repeat: true });
        assert.equal(prevented, true);
        assert.deepEqual(moves, ['right', 'up']);
    } finally {
        manager.destroy();
        assert.equal(stage.listenerCount('pointerdown'), 0);
        assert.equal(stage.listenerCount('pointercancel'), 0);
        assert.equal(listeners.size, 0);
        delete globalThis.window;
    }
});
