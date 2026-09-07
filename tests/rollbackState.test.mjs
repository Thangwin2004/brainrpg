import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captureTurn, rollbackPresentation } from '../src/core/rollbackState.js';

test('turn snapshots preserve all mutable board state and identity of artwork', () => {
    const texture = Object.freeze({ id: 'boss-art' });
    const player = { gridX: 0, gridY: 1, power: 23 };
    const boss = { isMonster: true, isBoss: true, power: 20, sprite: { texture } };
    const item = { type: 'divide', power: 2, sprite: { texture } };
    const scene = { floor: 4, turnCount: 6, player, grid: [[boss, item], [player, null]],
        walls: [[false, false], [false, true]], tileStates: [[0, 0], [0, 2]] };
    const snapshot = captureTurn(scene);
    boss.power = 99;
    item.power = 4;
    player.power = 0;
    player.gridX = 1;
    scene.walls[1][0] = true;
    scene.tileStates[1][0] = 2;
    scene.turnCount++;
    assert.deepEqual({ power: snapshot.power, x: snapshot.playerX, y: snapshot.playerY, turn: snapshot.turnCount },
        { power: 23, x: 0, y: 1, turn: 6 });
    assert.deepEqual(snapshot.walls, [[false, false], [false, true]]);
    assert.deepEqual(snapshot.tileStates, [[0, 0], [0, 2]]);
    assert.deepEqual(snapshot.entities.map(e => [e.kind, e.power, e.isBoss, e.itemType]),
        [['monster', 20, true, undefined], ['item', 2, false, 'divide']]);
    assert.equal(snapshot.entities[0].texture, texture);
    assert.equal(snapshot.entities.length, 2); // Neither player nor empty cells become entities.
});

test('rollback labels distinguish empty history, remaining free uses, ads and locks', () => {
    assert.deepEqual(rollbackPresentation({ count: 3, historySize: 0 }), {
        enabled: false, badge: '3', mode: 'empty', title: 'HOÀN TÁC', detail: 'Chưa có bước để lùi',
    });
    const free = rollbackPresentation({ count: 2, historySize: 4 });
    assert.equal(free.enabled, true);
    assert.equal(free.badge, '2');
    assert.match(free.detail, /Miễn phí/);
    const ad = rollbackPresentation({ count: 0, historySize: 4 });
    assert.equal(ad.enabled, true);
    assert.equal(ad.badge, 'QC');
    assert.match(ad.detail, /Xem QC/);
    assert.equal(rollbackPresentation({ count: 0, historySize: 0 }).enabled, false);
    assert.equal(rollbackPresentation({ count: 3, historySize: 4, blocked: true }).mode, 'blocked');
    const busy = rollbackPresentation({ count: 0, historySize: 4, blocked: true, busy: 'ad' });
    assert.equal(busy.enabled, false);
    assert.equal(busy.mode, 'busy');
    assert.match(busy.detail, /quảng cáo/);
    assert.match(rollbackPresentation({ count: 0, historySize: 4, busy: 'undo' }).detail, /Đang lùi/);
});
