export const START_POWER = 10;

// The renderer and the generator use the same combat rule: ties lose.
export function resolveEncounter(power, entity) {
    if (!entity) return { survives: true, power };
    if (entity.kind === 'monster' || entity.isMonster) {
        return { survives: power > entity.power, power: power + entity.power };
    }
    const type = entity.itemType ?? entity.type;
    const next = type === 'multiply' ? power * entity.power
        : type === 'divide' ? Math.floor(power / entity.power) : power + entity.power;
    return { survives: next > 0, power: next };
}

export function hasSafeMove(grid, walls, x, y, power) {
    return [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        return ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length
            && !walls[ny][nx] && resolveEncounter(power, grid[ny][nx]).survives;
    });
}

// Explicit encounter budgets keep different random maps at a comparable difficulty.
export function getFloorBalance(floor) {
    const tier = floor <= 2 ? 0 : floor === 3 ? 1 : floor <= 5 ? 2 : floor <= 10 ? 3 : 4;
    return {
        routeRewards: [5, 6, 7, 8, 9][tier],
        routeMonsters: [1, 2, 3, 4, 4][tier],
        sideMonsters: [2, 3, 4, 5, 6][tier],
        sideAdds: [3, 3, 3, 3, 3][tier],
        divides: [0, 1, 1, 2, 3][tier],
        multiplies: floor >= 4 ? 1 : 0,
    };
}

function shuffled(cells, random) {
    const result = [...cells];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function generatePuzzle(floor, random = Math.random) {
    if (!Number.isSafeInteger(floor) || floor < 1 || floor > 1000000) {
        throw new RangeError('Floor must be an integer from 1 to 1000000');
    }
    const balance = getFloorBalance(floor);
    const cols = floor <= 3 ? 5 : 6;
    const rows = floor <= 3 ? 6 : 7;
    const start = { x: Math.floor(cols / 2), y: rows - 1 };
    const boss = { x: Math.floor(cols / 2), y: 0 };
    const bossPower = 15 + floor * 5;
    const path = [{ ...start }];
    let x = start.x;
    // At least one horizontal step per row leaves room for gradual power growth.
    for (let y = rows - 1; y >= 1; y--) {
        let direction = random() < 0.5 ? -1 : 1;
        if (x + direction < 0 || x + direction >= cols) direction *= -1;
        const steps = 1 + Math.floor(random() * 2);
        for (let i = 0; i < steps; i++) {
            if (x + direction < 0 || x + direction >= cols) break;
            x += direction;
            path.push({ x, y });
        }
        if (y > 1) path.push({ x, y: y - 1 });
    }
    path.push({ x, y: 0 });
    while (x !== boss.x) {
        x += Math.sign(boss.x - x);
        path.push({ x, y: 0 });
    }

    const entities = [];
    let power = START_POWER;
    const requiredPower = bossPower + Math.max(2, Math.ceil(bossPower * 0.1));
    const cells = path.slice(1, -1);
    const rewardCount = Math.min(balance.routeRewards, cells.length);
    const rewardCells = Array.from({ length: rewardCount }, (_, i) =>
        cells[Math.round(i * (cells.length - 1) / (rewardCount - 1))]);
    // Begin with a small, safe pickup. Spread the remaining growth over the route.
    // Ordinary combat rewards cannot exceed current power (ties lose).
    let monstersLeft = balance.routeMonsters;
    for (let i = 0; i < rewardCount; i++) {
        const remaining = rewardCount - i;
        const needed = requiredPower - power;
        let reward = i === 0 ? 2 : Math.max(1, Math.round(needed / remaining));
        let kind = 'item';
        if (i > 0 && monstersLeft > 0 && (i % 2 === 1 || remaining <= monstersLeft)) {
            kind = 'monster';
            reward = Math.min(reward, power - 1);
            if (Math.abs(rewardCells[i].x - start.x) + Math.abs(rewardCells[i].y - start.y) === 1) {
                reward = Math.min(reward, START_POWER - 1);
            }
            monstersLeft--;
        }
        if (i === rewardCount - 1) {
            reward = needed;
            if (reward >= power) kind = 'item';
        }
        const entity = { ...rewardCells[i], kind, power: reward, itemType: 'add' };
        entities.push(entity);
        power = resolveEncounter(power, entity).power;
    }

    const pathKeys = new Set(path.map(cell => cell.x + ',' + cell.y));
    const available = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (!pathKeys.has(x + ',' + y)) available.push({ x, y });
        }
    }
    const pool = shuffled(available, random);
    const take = predicate => {
        const index = pool.findIndex(predicate);
        return index < 0 ? null : pool.splice(index, 1)[0];
    };
    const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    // Traps are optional branches, never the opening move or the guaranteed route.
    const traps = [];
    for (let i = 0; i < balance.divides; i++) {
        const cell = take(c => distance(c, start) > 2 && traps.every(t => distance(c, t) > 1));
        if (!cell) break;
        traps.push(cell);
        entities.push({ ...cell, kind: 'item', itemType: 'divide', power: 2 });
    }
    for (let i = 0; i < balance.multiplies; i++) {
        const cell = take(c => distance(c, start) > 2);
        if (cell) entities.push({ ...cell, kind: 'item', itemType: 'multiply', power: 2 });
    }
    // Distribute side enemies across bottom, middle and top instead of clustering.
    for (let i = 0; i < balance.sideMonsters; i++) {
        const band = i % 3;
        const cell = take(c => Math.min(2, Math.floor(c.y * 3 / rows)) === band) || take(() => true);
        if (!cell) break;
        const depth = (rows - 1 - cell.y) / (rows - 1);
        const expectedPower = START_POWER + (requiredPower - START_POWER) * depth;
        const strength = Math.max(2, Math.min(distance(cell, start) === 1 ? START_POWER - 1 : bossPower - 1,
            Math.round(expectedPower * (0.45 + random() * 0.4))));
        entities.push({ ...cell, kind: 'monster', power: strength });
    }
    for (let i = 0; i < balance.sideAdds; i++) {
        const cell = take(c => i !== 0 || c.y >= rows - 2) || take(() => true);
        if (!cell) break;
        const depth = (rows - 1 - cell.y) / (rows - 1);
        const reward = Math.max(2, Math.round(2 + (requiredPower - START_POWER) * (0.025 + depth * 0.04)));
        entities.push({ ...cell, kind: 'item', itemType: 'add', power: reward });
    }
    entities.push({ ...boss, kind: 'monster', isBoss: true, power: bossPower });
    return { floor, cols, rows, start, boss, bossPower, entities, solution: path };
}
