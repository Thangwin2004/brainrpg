import { t } from '../system/I18nManager.js';

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
    const badge = count > 0 ? String(count) : t('rollback.adBadge');
    if (busy) return { enabled: false, badge, mode: 'busy', title: t('rollback.busy'), detail: busy === 'ad' ? t('rollback.loadingAd') : t('rollback.rewinding') };
    if (!historySize) return { enabled: false, badge, mode: 'empty', title: t('rollback.title'), detail: t('rollback.empty') };
    if (blocked) return { enabled: false, badge, mode: 'blocked', title: t('rollback.title'), detail: t('rollback.blocked') };
    return { enabled: true, badge, mode: count > 0 ? 'free' : 'ad', title: t('rollback.title'),
        detail: count > 0 ? t('rollback.freeDetail') : t('rollback.adDetail') };
}
