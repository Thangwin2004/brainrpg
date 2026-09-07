// Texture references are immutable shared assets; all mutable board data is copied.
export function captureTurn(scene) {
    return {
        floor: scene.floor,
        playerX: scene.player.gridX,
        playerY: scene.player.gridY,
        power: scene.player.power,
        turnCount: scene.turnCount,
        walls: scene.walls.map(row => [...row]),
        tileStates: scene.tileStates.map(row => [...row]),
        entities: scene.grid.flatMap((row, y) => row.flatMap((entity, x) => {
            if (!entity || entity === scene.player) return [];
            return [{ x, y, kind: entity.isMonster ? 'monster' : 'item',
                power: entity.power, itemType: entity.type, isBoss: !!entity.isBoss,
                texture: entity.sprite.texture }];
        })),
    };
}

export function rollbackPresentation({ count, historySize, blocked = false, busy = false }) {
    const badge = count > 0 ? String(count) : 'QC';
    if (busy) return { enabled: false, badge, mode: 'busy', title: 'ĐANG XỬ LÝ', detail: busy === 'ad' ? 'Đang tải quảng cáo…' : 'Đang lùi 1 bước…' };
    if (!historySize) return { enabled: false, badge, mode: 'empty', title: 'HOÀN TÁC', detail: 'Chưa có bước để lùi' };
    if (blocked) return { enabled: false, badge, mode: 'blocked', title: 'HOÀN TÁC', detail: 'Tạm khóa thao tác' };
    return { enabled: true, badge, mode: count > 0 ? 'free' : 'ad', title: 'HOÀN TÁC',
        detail: count > 0 ? 'Lùi 1 bước · Miễn phí' : 'Xem QC · Lùi 1 bước' };
}
