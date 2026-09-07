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

export function generatePuzzle(floor, random = Math.random) {
    // Keep cells readable on phones; difficulty comes from choices, not board size.
    const cols = floor <= 3 ? 5 : 6;
    const rows = floor <= 3 ? 6 : 7;
    const start = { x: Math.floor(cols / 2), y: rows - 1 };
    const boss = { x: Math.floor(cols / 2), y: 0 };
    const bossPower = 15 + floor * 5;
    const path = [{ ...start }];
    let x = start.x;
    // At most two horizontal steps per row: finite, connected, no revisits.
    for (let y = rows - 1; y >= 1; y--) {
        const direction = random() < 0.5 ? -1 : 1;
        const steps = Math.floor(random() * 3);
        for (let i = 0; i < steps; i++) {
            if (x + direction < 0 || x + direction >= cols) break;
            x += direction;
            path.push({ x, y });
        }
        if (y > 1) path.push({ x, y: y - 1 });
    }
    // Use the top row to approach the boss without retracing row 1.
    path.push({ x, y: 0 });
    while (x !== boss.x) {
        x += Math.sign(boss.x - x);
        path.push({ x, y: 0 });
    }

    const entities = [];
    let power = START_POWER;
    const requiredPower = bossPower + Math.max(2, Math.ceil(bossPower * 0.1));
    const rewardCells = path.slice(1, -1).filter((_, index, cells) =>
        index === 0 || index === cells.length - 1 || random() < 0.65);
    for (let i = 0; i < rewardCells.length; i++) {
        const needed = requiredPower - power;
        if (needed <= 0) break;
        const average = needed / (rewardCells.length - i);
        const reward = Math.min(needed, i === rewardCells.length - 1 ? needed
            : Math.max(1, Math.round(average * (0.65 + random() * 0.7))));
        const kind = reward < power && random() < 0.4 ? 'monster' : 'item';
        const entity = { ...rewardCells[i], kind, power: reward, itemType: 'add' };
        entities.push(entity);
        power = resolveEncounter(power, entity).power;
    }

    const pathKeys = new Set(path.map(cell => `${cell.x},${cell.y}`));
    const difficulty = Math.min(1, (floor - 1) / 12);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (pathKeys.has(`${x},${y}`)) continue;
            const roll = random();
            if (roll < 0.15 + difficulty * 0.1) {
                entities.push({ x, y, kind: 'monster', power: Math.ceil(bossPower * (0.45 + random() * 0.9)) });
            } else if (floor >= 3 && roll < 0.21 + difficulty * 0.14) {
                entities.push({ x, y, kind: 'item', itemType: 'divide', power: 2 });
            } else if (roll < 0.42) {
                entities.push({ x, y, kind: 'item', itemType: floor >= 4 && random() < 0.15 ? 'multiply' : 'add', power: 2 + Math.floor(random() * 4) });
                if (entities.at(-1).itemType === 'multiply') entities.at(-1).power = 2;
            }
        }
    }
    entities.push({ ...boss, kind: 'monster', isBoss: true, power: bossPower });
    return { floor, cols, rows, start, boss, bossPower, entities, solution: path };
}
