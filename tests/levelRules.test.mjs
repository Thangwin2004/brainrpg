import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePuzzle, resolveEncounter, hasSafeMove, START_POWER, getFloorBalance } from '../src/core/levelRules.js';

function seededRandom(seed) {
    return () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    };
}

test('10,000 generated floors have a winning route without revisiting collapsed cells', () => {
    for (let seed = 1; seed <= 10000; seed++) {
        const floor = 1 + (seed % 200);
        const level = generatePuzzle(floor, seededRandom(seed));
        const grid = Array.from({ length: level.rows }, () => Array(level.cols).fill(null));
        const walls = grid.map(row => row.map(() => false));
        const occupied = new Set();
        for (const entity of level.entities) {
            const key = `${entity.x},${entity.y}`;
            assert.ok(!occupied.has(key), `overlap: seed ${seed}`);
            occupied.add(key);
            assert.ok(Number.isSafeInteger(entity.power) && entity.power > 0);
            grid[entity.y][entity.x] = entity;
        }
        assert.equal(grid[level.start.y][level.start.x], null);
        assert.equal(level.entities.filter(e => e.isBoss).length, 1);
        assert.deepEqual(level.solution[0], level.start);
        assert.deepEqual(level.solution.at(-1), level.boss);
        let power = START_POWER;
        let previous = level.start;
        for (const cell of level.solution.slice(1)) {
            assert.equal(Math.abs(cell.x - previous.x) + Math.abs(cell.y - previous.y), 1);
            assert.equal(walls[cell.y][cell.x], false, `revisited cell: seed ${seed}`);
            assert.ok(hasSafeMove(grid, walls, previous.x, previous.y, power));
            const result = resolveEncounter(power, grid[cell.y][cell.x]);
            assert.ok(result.survives, `unwinnable: seed ${seed}, floor ${floor}`);
            power = result.power;
            walls[previous.y][previous.x] = true;
            grid[cell.y][cell.x] = null;
            previous = cell;
        }
        assert.ok(power > level.bossPower * 2);
    }
});

test('extreme random streams still produce finite, non-overlapping paths', () => {
    for (const value of [0, 0.499, 0.999999]) {
        const level = generatePuzzle(50, () => value);
        assert.equal(new Set(level.solution.map(c => `${c.x},${c.y}`)).size, level.solution.length);
        assert.ok(level.solution.length <= level.cols * level.rows);
    }
});

test('ties lose, winning combat absorbs power, and traps round down', () => {
    assert.equal(resolveEncounter(10, { isMonster: true, power: 10 }).survives, false);
    assert.deepEqual(resolveEncounter(10, { isMonster: true, power: 9 }), { survives: true, power: 19 });
    assert.deepEqual(resolveEncounter(11, { type: 'divide', power: 2 }), { survives: true, power: 5 });
    assert.equal(resolveEncounter(1, { type: 'divide', power: 2 }).survives, false);
    assert.equal(resolveEncounter(7, { type: 'multiply', power: 2 }).power, 14);
    assert.equal(resolveEncounter(7, { type: 'add', power: 3 }).power, 10);
});

test('dead-end detection respects boundaries, collapsed floors, strong enemies and lethal traps', () => {
    const grid = [[null, { isMonster: true, power: 10 }], [{ type: 'divide', power: 2 }, null]];
    const walls = [[false, false], [false, false]];
    assert.equal(hasSafeMove(grid, walls, 0, 0, 1), false);
    assert.equal(hasSafeMove(grid, walls, 0, 0, 10), true);
    walls[1][0] = true;
    assert.equal(hasSafeMove(grid, walls, 0, 0, 10), false);
    assert.equal(hasSafeMove(grid, walls, 0, 0, 11), true);
    walls[0][1] = true;
    assert.equal(hasSafeMove(grid, walls, 0, 0, 100), false);
});

test('early floors introduce no divide or multiply items', () => {
    for (let seed = 1; seed <= 100; seed++) {
        for (const floor of [1, 2]) {
            assert.ok(generatePuzzle(floor, seededRandom(seed)).entities.every(e => e.kind !== 'item' || e.itemType === 'add'));
        }
    }
});


test('encounter budgets and safe openings remain consistent across 20,000 maps', () => {
    for (let seed = 1; seed <= 20000; seed++) {
        const floor = 1 + seed % 200;
        const level = generatePuzzle(floor, seededRandom(seed));
        const budget = getFloorBalance(floor);
        const monsters = level.entities.filter(e => e.kind === 'monster' && !e.isBoss);
        const adds = level.entities.filter(e => e.kind === 'item' && e.itemType === 'add');
        const traps = level.entities.filter(e => e.itemType === 'divide');
        const multipliers = level.entities.filter(e => e.itemType === 'multiply');
        assert.equal(monsters.length, budget.routeMonsters + budget.sideMonsters);
        assert.equal(adds.length, budget.routeRewards - budget.routeMonsters + budget.sideAdds);
        assert.equal(traps.length, budget.divides);
        assert.equal(multipliers.length, budget.multiplies);
        assert.ok(monsters.every(e => e.power < level.bossPower));
        const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        const first = level.solution[1];
        const opening = level.entities.find(e => e.x === first.x && e.y === first.y);
        assert.equal(opening.itemType, 'add');
        assert.equal(opening.power, 2);
        assert.ok(level.entities.filter(e => distance(e, level.start) === 1)
            .every(e => resolveEncounter(START_POWER, e).survives));
        for (const trap of traps) {
            assert.ok(distance(trap, level.start) > 2);
            assert.ok(traps.every(other => other === trap || distance(trap, other) > 1));
            assert.ok(!level.solution.some(c => c.x === trap.x && c.y === trap.y));
        }
        for (const item of multipliers) {
            assert.equal(item.power, 2);
            assert.ok(distance(item, level.start) > 2);
        }
        assert.ok(level.entities.length / (level.cols * level.rows) <= 0.6);
    }
});

test('tier transitions remain solvable with extreme random streams', () => {
    for (const floor of [1, 2, 3, 4, 5, 6, 10, 11, 50, 200, 1000, 1000000]) {
        for (const value of [0, 0.499, 0.999999]) {
            const level = generatePuzzle(floor, () => value);
            let power = START_POWER;
            for (const cell of level.solution.slice(1)) {
                const entity = level.entities.find(e => e.x === cell.x && e.y === cell.y);
                const result = resolveEncounter(power, entity);
                assert.ok(result.survives, 'floor ' + floor);
                assert.ok(Number.isSafeInteger(result.power));
                power = result.power;
            }
        }
    }
});
