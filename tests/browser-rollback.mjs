import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync('qa.local', { recursive: true });
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('https://fonts.googleapis.com/**', route => route.abort());
await page.route('**/src/main.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('const game = new Game();', 'const game = new Game(); window.__testGame = game;') });
});
const ready = () => page.waitForFunction(() => !window.__testGame.currentScene.isProcessingSwipe);
const state = () => page.evaluate(() => {
    const s = window.__testGame.currentScene;
    return {
        power: s.player.power, x: s.player.gridX, y: s.player.gridY, turn: s.turnCount,
        walls: s.walls, tiles: s.tileStates,
        grid: s.grid.map(row => row.map(e => e === s.player ? 'player' : e ? {
            kind: e.isMonster ? 'monster' : 'item', power: e.power, type: e.type, boss: !!e.isBoss, texture: e.sprite.texture.uid,
        } : null)),
        boss: { x: s.bossEntity.gridX, y: s.bossEntity.gridY, power: s.bossEntity.power },
    };
});
const hud = () => page.evaluate(() => {
    const s = window.__testGame.currentScene;
    return { ...s.statsBar.rollbackBtn.presentation, history: s.moveHistory.length, count: s.freeRollbacks };
});
const fixture = async (entities, power = 10) => page.evaluate(({ entities, power }) => {
    const s = window.__testGame.currentScene;
    s.levelLayout = { floor: 1, cols: 5, rows: 6, start: { x: 2, y: 5 }, boss: { x: 2, y: 0 }, bossPower: 20,
        entities: [...entities, { x: 2, y: 0, kind: 'monster', isBoss: true, power: 20 }] };
    s.levelTextures = new Map();
    s.reviveCleanup?.();
    s.generateLevel(1);
    s.freeRollbacks = 3;
    s.player.resetPower(power);
    s.updateStatsUI();
}, { entities, power });
const move = direction => page.evaluate(direction => window.__testGame.currentScene.handleSwipe(direction), direction);
const clickUndo = async () => {
    const p = await page.evaluate(() => {
        const p = window.__testGame.currentScene.statsBar.rollbackBtn.getGlobalPosition();
        return { x: p.x, y: p.y };
    });
    await page.mouse.click(p.x, p.y);
    await ready();
};
try {
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5177');
    await page.waitForFunction(() => window.__testGame?.currentScene?.playBtn?.visible);
    await page.mouse.click(195, 844 * 0.55);
    await page.waitForFunction(() => window.__testGame.currentScene.tutorialModal);
    await page.evaluate(() => window.__testGame.currentScene.tutorialModal.close());
    await ready();
    await fixture([
        { x: 3, y: 5, kind: 'item', itemType: 'add', power: 3 },
        { x: 3, y: 4, kind: 'item', itemType: 'multiply', power: 2 },
        { x: 2, y: 4, kind: 'item', itemType: 'divide', power: 2 },
        { x: 1, y: 4, kind: 'monster', power: 4 },
    ]);
    const states = [await state()];
    await clickUndo();
    assert.deepEqual(await state(), states[0]);
    assert.equal((await hud()).count, 3);
    await page.screenshot({ path: 'qa.local/rollback-empty.png' });
    for (const direction of ['right', 'up', 'left', 'left']) {
        await move(direction);
        states.push(await state());
    }
    assert.equal(states[4].power, 17);
    assert.equal((await hud()).history, 4);
    await page.screenshot({ path: 'qa.local/rollback-ready.png' });
    // Releasing a pointer over undo without pressing it must not activate it.
    const button = await page.evaluate(() => {
        const p = window.__testGame.currentScene.statsBar.rollbackBtn.getGlobalPosition();
        return { x: p.x, y: p.y };
    });
    await page.mouse.move(button.x, button.y + 70);
    await page.mouse.down();
    await page.mouse.move(button.x, button.y);
    await page.mouse.up();
    assert.equal((await hud()).history, 4);
    for (let index = 3; index >= 1; index--) {
        await clickUndo();
        assert.deepEqual(await state(), states[index]);
        assert.equal((await hud()).count, index - 1);
        assert.equal((await hud()).history, index);
    }
    assert.equal((await hud()).mode, 'ad');
    await page.screenshot({ path: 'qa.local/rollback-ad.png' });
    console.log('PASS: disabled initial click, release-without-press, 3 consecutive exact undo states including combat and ×/÷ items');

    // Ad outcomes are stubs: no external ad is requested during these tests.
    for (const outcome of ['cancel', 'throw']) {
        await page.evaluate(async outcome => {
            const { AdManager } = await import('/src/managers/AdManager.js');
            AdManager.showRewardedVideo = async () => {
                if (outcome === 'throw') throw new Error('test ad failure');
                return false;
            };
            await window.__testGame.currentScene.handleRollback();
        }, outcome);
        assert.deepEqual(await state(), states[1]);
        assert.equal((await hud()).history, 1);
        assert.equal((await hud()).count, 0);
        assert.equal((await hud()).enabled, true);
    }
    await page.evaluate(async () => {
        const { AdManager } = await import('/src/managers/AdManager.js');
        window.__adCalls = 0;
        AdManager.showRewardedVideo = () => { window.__adCalls++; return new Promise(resolve => { window.__resolveAd = resolve; }); };
        const s = window.__testGame.currentScene;
        window.__undoPending = s.handleRollback();
        s.handleRollback();
        s.handleSwipe('up');
        s.handleRestart();
        s.openSettings();
    });
    assert.equal((await hud()).mode, 'busy');
    assert.equal(await page.evaluate(() => window.__adCalls), 1);
    assert.deepEqual(await state(), states[1]);
    await page.screenshot({ path: 'qa.local/rollback-busy.png' });
    await page.evaluate(async () => { window.__resolveAd(true); await window.__undoPending; });
    assert.deepEqual(await state(), states[0]);
    assert.equal((await hud()).history, 0);
    assert.equal((await hud()).count, 0);
    console.log('PASS: ad cancellation/exception preserve board and history; success grants exactly one undo; busy blocks duplicate requests');

    await fixture([{ x: 2, y: 4, kind: 'monster', power: 10 }]);
    const beforeLoss = await state();
    await move('up');
    await page.locator('#btn-undo-defeat').waitFor();
    assert.equal((await state()).power, 0);
    await page.locator('#btn-undo-defeat').click();
    await ready();
    assert.deepEqual(await state(), beforeLoss);
    assert.equal((await hud()).history, 0);
    assert.equal((await hud()).count, 2);
    console.log('PASS: first-move fatal attack restores the same position, enemy, floor and power (no previous move required)');

    // A failed attack after a normal move must undo the attack, not that normal move.
    await fixture([{ x: 3, y: 4, kind: 'monster', power: 50 }]);
    await move('right');
    const beforeSecondLoss = await state();
    await move('up');
    await page.locator('#btn-undo-defeat').waitFor();
    await page.locator('#btn-undo-defeat').click();
    await ready();
    assert.deepEqual(await state(), beforeSecondLoss);
    assert.equal((await hud()).history, 1);
    await clickUndo();
    assert.equal((await state()).turn, 0);
    console.log('PASS: fatal attack rolls back precisely one turn and preserves older history');

    await fixture([{ x: 2, y: 4, kind: 'item', itemType: 'divide', power: 2 }], 1);
    const beforeTrap = await state();
    await move('up');
    await page.locator('#btn-undo-defeat').waitFor();
    await page.evaluate(async () => {
        const s = window.__testGame.currentScene;
        s.freeRollbacks = 0;
        const { AdManager } = await import('/src/managers/AdManager.js');
        AdManager.showRewardedVideo = async () => false;
        await s.handleRollback(true);
    });
    await page.locator('#btn-undo-defeat').waitFor();
    assert.equal((await state()).power, 0);
    assert.equal((await hud()).history, 1);
    assert.equal(await page.evaluate(() => window.__testGame.currentScene.inputBlocked), true);
    await page.evaluate(async () => {
        const { AdManager } = await import('/src/managers/AdManager.js');
        AdManager.showRewardedVideo = async () => true;
    });
    await page.locator('#btn-undo-defeat').click();
    await ready();
    assert.deepEqual(await state(), beforeTrap);
    console.log('PASS: lethal trap + failed rewarded recovery retains defeat overlay; successful recovery restores trap and power');

    await fixture([]);
    await move('right');
    await page.evaluate(() => window.__testGame.currentScene.handleRestart());
    assert.equal((await hud()).history, 0);
    assert.equal((await hud()).enabled, false);
    await move('right');
    await page.evaluate(async () => {
        const s = window.__testGame.currentScene;
        s.freeRollbacks = 0;
        const { AdManager } = await import('/src/managers/AdManager.js');
        AdManager.showRewardedVideo = () => new Promise(resolve => { window.__resolveAd = resolve; });
        window.__undoPending = s.handleRollback();
        s.game.setScene(null);
        window.__resolveAd(true);
        await window.__undoPending;
    });
    await page.waitForTimeout(400);
    assert.deepEqual(errors, []);
    console.log('PASS: restart clears history; delayed ad completion after scene destruction is ignored; zero page exceptions');
} catch (error) {
    console.log('PAGE ERRORS', errors);
    await page.screenshot({ path: 'qa.local/rollback-failure.png' });
    throw error;
} finally {
    await browser.close();
}
