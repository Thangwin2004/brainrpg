import { Container, Graphics, FillGradient, Sprite, Assets, ColorMatrixFilter, BlurFilter, Text, TextStyle } from 'pixi.js';
import { Player } from '../entities/Player.js';
import { Monster } from '../entities/Monster.js';
import { Item } from '../entities/Item.js';
import { SwipeManager } from '../managers/SwipeManager.js';
import { StatsBar } from '../ui/StatsBar.js';
import { TutorialModal } from '../ui/TutorialModal.js';
import { AdManager } from '../managers/AdManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { GameOverScene } from './GameOverScene.js';
import { SettingsModal } from '../ui/SettingsModal.js';
import { MenuScene } from './MenuScene.js';
import { winkGame } from '../integrations/wink/wink-adapter.js';
import gsap from 'gsap';
import { generatePuzzle, resolveEncounter, hasSafeMove, START_POWER } from '../core/levelRules.js';
import { captureTurn } from '../core/rollbackState.js';

export class GameScene extends Container {
    init(game) {
        this.game = game;
        const { width, height } = game.app.screen;

        // Background — Tribal Tower Interior
        this.bgContainer = new Container();
        this.addChild(this.bgContainer);

        // 1. Blurred Background System
        this.bgBlurredImage = new Sprite(Assets.get('bg_game'));
        this.bgBlurredImage.anchor.set(0.5);
        this.bgBlurredImage.filters = [new BlurFilter(15)];
        this.bgBlurredImage.tint = 0x888888;
        this.bgContainer.addChild(this.bgBlurredImage);

        // 2. Main Background System
        this.bgImage = new Sprite(Assets.get('bg_game'));
        this.bgImage.anchor.set(0.5);
        this.bgContainer.addChild(this.bgImage);

        // Filter to change colors based on floor
        this.bgFilter = new ColorMatrixFilter();
        // Apply filter to container so both blur and main image get colorized
        this.bgContainer.filters = [this.bgFilter];

        // Game State
        this.floor = 1;

        // ── Wink: start a new round ──
        this._winkRound = winkGame.startRound();
        this.isProcessingSwipe = false;
        this.freeRollbacks = 3;
        this.turnCount = 0;
        this.moveHistory = [];
        this.rollbackBusy = false;
        this.sceneTimers = new Set();

        this.floorContainer = new Container();
        this.addChild(this.floorContainer);

        this.gridContainer = new Container();
        this.addChild(this.gridContainer);

        // UI
        this.statsBar = new StatsBar(width, this.openSettings.bind(this), this.handleRestart.bind(this));
        this.statsBar.onRollback = this.handleRollback.bind(this);
        this.addChild(this.statsBar);

        this.statusText = new Text({ text: '', style: {
            fontFamily: ['Be Vietnam Pro', 'sans-serif'], fontSize: 14, fontWeight: '700',
            fill: 0xffffff, align: 'center', wordWrap: true, wordWrapWidth: width - 24,
            stroke: { color: 0x453268, width: 1.5 },
        } });
        this.statusText.anchor.set(0.5, 1);
        this.addChild(this.statusText);

        this.swipeManager = new SwipeManager(game.app, this.handleSwipe.bind(this), {
            canStart: () => !this.isProcessingSwipe && !this.inputBlocked,
            contains: point => {
                const local = this.gridContainer.toLocal(point);
                return Math.abs(local.x) <= this.cols * this.cellSize / 2
                    && Math.abs(local.y) <= this.rows * this.cellSize / 2;
            },
        });

        // Each floor is a separate puzzle starting at START_POWER.
        this.player = new Player();
        this.gridContainer.addChild(this.player);

        this.generateLevel(this.floor);
    }

    resize(width, height) {
        if (this.bgBlurredImage && this.bgBlurredImage.texture) {
            this.bgBlurredImage.position.set(width / 2, height / 2);
            this.bgBlurredImage.scale.set(Math.max(width / this.bgBlurredImage.texture.width, height / this.bgBlurredImage.texture.height));
        }
        if (this.bgImage && this.bgImage.texture) {
            const isLandscape = width > height;
            const scale = isLandscape
                ? Math.min(width / this.bgImage.texture.width, height / this.bgImage.texture.height)
                : Math.max(width / this.bgImage.texture.width, height / this.bgImage.texture.height);
            this.bgImage.position.set(width / 2, height / 2);
            this.bgImage.scale.set(scale);
        }
        const isLandscape = width > height;
        const compactLandscape = isLandscape && height < 600;
        const topMargin = isLandscape ? 20 : Math.max(32, height * 0.05);

        if (this.statsBar) {
            this.statsBar.resize(width, height);
            this.statsBar.position.y = topMargin;
        }

        if (this.cols && this.rows) {
            const headerH = compactLandscape ? 0 : (this.statsBar ? this.statsBar.totalHeight : 100) + topMargin;
            const gap = compactLandscape ? 32 : isLandscape ? 16 : Math.max(24, height * 0.04);
            const bottomPad = compactLandscape ? 54 : 76;
            const availH = Math.max(40, height - headerH - gap - bottomPad);

            let maxGridPx;
            if (compactLandscape) {
                maxGridPx = Math.max(80, width - 280);
            } else if (isLandscape) {
                const bgW = this.bgImage.texture.width * this.bgImage.scale.x;
                const sidePad = Math.max(12, bgW * 0.04);
                maxGridPx = Math.min(bgW - sidePad * 2, availH);
            } else {
                const sidePad = Math.max(12, width * 0.04);
                maxGridPx = Math.min(width - sidePad * 2, availH);
            }

            const gridTotalW = this.baseCellSize * this.cols;
            const gridTotalH = this.baseCellSize * this.rows;

            const scale = Math.min(maxGridPx / gridTotalW, availH / gridTotalH);

            this.gridContainer.scale.set(scale);
            if (this.floorContainer) {
                this.floorContainer.scale.set(scale);
            }

            let gridY = compactLandscape ? (height - bottomPad + gap) / 2 : height * 0.62;
            const scaledGridHeight = gridTotalH * scale;

            const minGridY = headerH + gap + scaledGridHeight / 2;
            if (gridY < minGridY) gridY = minGridY;

            const maxGridY = height - bottomPad - scaledGridHeight / 2;
            if (gridY > maxGridY) gridY = maxGridY;

            this.gridContainer.position.set(width / 2, gridY);
            if (this.floorContainer) this.floorContainer.position.set(width / 2, gridY);
        }
        if (this.statusText) {
            this.statusText.style.wordWrapWidth = width - 24;
            this.statusText.position.set(width / 2, height - 10);
        }
        if (this.tutorialModal) this.tutorialModal.resize(width, height);
        if (this.settingsModal) this.settingsModal.resize(width, height);
    }
    generateLevel(floor) {
        this.isProcessingSwipe = true;
        this.inputBlocked = false;
        this.turnCount = 0;
        this.rollbackBusy = false;
        this.moveHistory = [];
        this.levelRevision = (this.levelRevision || 0) + 1;
        this.player.resetPower(START_POWER);
        for (const child of this.floorContainer.removeChildren()) child.destroy({ children: true });
        if (!this.levelLayout || this.levelLayout.floor !== floor) {
            this.levelLayout = generatePuzzle(floor);
            this.levelTextures = new Map();
        }
        this.clearBoardEntities();

        if (this.tutorialText) {
            this.removeChild(this.tutorialText);
            this.tutorialText.destroy();
            this.tutorialText = null;
        }

        const { cols, rows, start, boss } = this.levelLayout;

        this.cols = cols;
        this.rows = rows;
        this.grid = Array(rows).fill(null).map(() => Array(cols).fill(null));
        this.walls = Array(rows).fill(null).map(() => Array(cols).fill(true));
        this.tileStates = Array(rows).fill(null).map(() => Array(cols).fill(0));
        this.cellGraphics = Array(rows).fill(null).map(() => Array(cols).fill(null));

        this.baseCellSize = 74;
        this.cellSize = this.baseCellSize;
        const gridW = this.baseCellSize * cols;
        const gridH = this.baseCellSize * rows;
        this.gridOffsetX = -gridW / 2;
        this.gridOffsetY = -gridH / 2;

        this.resize(this.game.app.screen.width, this.game.app.screen.height);
        this.updateBackgroundHue(floor);

        const pX = start.x, pY = start.y, bX = boss.x, bY = boss.y;
        this.walls = Array.from({ length: rows }, () => Array(cols).fill(false));
        for (const data of this.levelLayout.entities) {
            const key = `${data.x},${data.y}`;
            const texture = this.levelTextures.get(key);
            const entity = data.kind === 'monster'
                ? new Monster(data.power, !!data.isBoss, texture) : new Item(data.power, data.itemType, texture);
            this.levelTextures.set(key, entity.sprite.texture);
            this.placeEntity(entity, data.x, data.y);
            if (data.isBoss) this.bossEntity = entity;
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = new Graphics();
                const size = this.cellSize + 0.5;
                const offset = -size / 2;
                
                const isBossCell = (r === bY && c === bX);
                const cellColor = isBossCell ? 0xFFF3E0 : 0xF3F3F4;
                cell.roundRect(offset, offset, size, size, 14)
                    .fill({ color: cellColor })
                    .stroke({ color: 0xCBC4D0, width: 1 });
                
                const gridW = this.cols * this.cellSize;
                const gridH = this.rows * this.cellSize;
                cell.position.set(c * this.cellSize - gridW / 2 + this.cellSize / 2, r * this.cellSize - gridH / 2 + this.cellSize / 2);
                this.floorContainer.addChild(cell);
                this.cellGraphics[r][c] = cell;
            }
        }
        
        this.gridContainer.children.sort((a, b) => {
            const isAG = a.constructor.name === 'Graphics';
            const isBG = b.constructor.name === 'Graphics';
            if (isAG && !isBG) return -1;
            if (!isAG && isBG) return 1;
            return a.y - b.y;
        });

        const startPos = this.getWorldPos(pX, pY);
        this.player.position.set(startPos.x, startPos.y);
        this.player.gridX = pX;
        this.player.gridY = pY;
        this.grid[pY][pX] = this.player;
        this.gridContainer.setChildIndex(this.player, this.gridContainer.children.length - 1);

        this.updateStatsUI();
        if (floor === 1 && !this.tutorialShown) {
            this.tutorialShown = true;
            this.isProcessingSwipe = true; // Keep it true to block swipe
            const { width, height } = this.game.app.screen;
            this.tutorialModal = new TutorialModal(width, height, () => {
                this.tutorialModal = null;
                this.isProcessingSwipe = false;
                if (this.statsBar) this.updateRollbackUI();
            });
            this.addChild(this.tutorialModal);
        } else {
            this.isProcessingSwipe = false;
            this.updateRollbackUI();
        }
    }

    updateCellVisuals(r, c) {
        const cell = this.cellGraphics[r][c];
        if (!cell) return;
        cell.clear();
        const state = this.tileStates[r][c];

        const size = this.cellSize + 0.5; // seamless
        const offset = -size / 2;
        if (this.walls[r][c]) {
            cell.roundRect(offset, offset, size, size, 14)
                .fill({ color: 0x546E7A })
                .stroke({ color: 0x37474F, width: 2 });
        } else if (state === 1) {
            cell.roundRect(offset, offset, size, size, 14)
                .fill({ color: 0xFFCDD2 })
                .stroke({ color: 0xE53935, width: 2 });
        } else {
            const entity = this.grid[r][c];
            const adjacent = Math.abs(this.player.gridX - c) + Math.abs(this.player.gridY - r) === 1;
            const dangerous = entity !== this.player && !resolveEncounter(this.player.power, entity).survives;
            const poison = entity?.isItem && entity.type === 'divide';
            const color = dangerous ? 0xFFCDD2 : poison ? 0xE1BEE7 : entity?.isBoss ? 0xFFF3E0 : 0xF3F3F4;
            cell.roundRect(offset, offset, size, size, 14)
                .fill({ color })
                .stroke({ color: adjacent ? (dangerous ? 0xE53935 : 0x26A69A) : 0xCBC4D0, width: adjacent ? 3 : 1 });
        }
    }

    nextFloor() {
        // 1. Block input immediately
        this.isProcessingSwipe = true;

        // 2. Animate Grid fading out
        if (this.floorContainer) {
            gsap.to(this.floorContainer, {
                alpha: 0,
                y: this.floorContainer.y + 30,
                duration: 0.3,
                ease: "power2.in"
            });
        }
        gsap.to(this.gridContainer, {
            alpha: 0,
            y: this.gridContainer.y + 30, // Drop down slightly
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                // 3. Increment floor and generate new level invisibly
                this.floor++;
                this.player.resetPower(10);
                this.generateLevel(this.floor);

                // Re-block input since generateLevel sets it to false
                this.isProcessingSwipe = true;

                // 4. Show a "Floor X" announcement text
                this.showFloorAnnouncement();
            }
        });
    }

    showFloorAnnouncement() {
        const { width, height } = this.game.app.screen;

        const announceText = new Text({
            text: `TẦNG ${this.floor}`,
            style: new TextStyle({
                fontFamily: ['Be Vietnam Pro', 'sans-serif'],
                fontSize: 64,
                fill: 0xFFCA28, // Gold
                stroke: { color: 0x5D4037, width: 8, join: 'round' },
                fontWeight: "900",
                letterSpacing: 2,
                dropShadow: {
                    alpha: 0.6,
                    angle: Math.PI / 6,
                    blur: 6,
                    color: 0x000000,
                    distance: 6
                }
            })
        });
        announceText.anchor.set(0.5);

        // Position it exactly where the grid is going to be
        announceText.position.set(width / 2, this.gridContainer.y);
        announceText.scale.set(0);
        announceText.alpha = 0;
        this.addChild(announceText);

        // Animate text pop in
        gsap.to(announceText.scale, { x: 1, y: 1, duration: 0.5, ease: "back.out(1.5)" });
        gsap.to(announceText, { alpha: 1, duration: 0.3 });

        // Hold then fade out and animate grid back in
        gsap.to(announceText, {
            alpha: 0,
            y: announceText.y - 40,
            duration: 0.4,
            delay: 0.8,
            ease: "power2.in",
            onComplete: () => {
                this.removeChild(announceText);
                announceText.destroy();

                // Fade grid back in
                this.gridContainer.alpha = 0;
                const originalY = this.gridContainer.y;
                this.gridContainer.y = originalY + 30; // start slightly below

                if (this.floorContainer) {
                    this.floorContainer.alpha = 0;
                    this.floorContainer.y = originalY + 30;
                    gsap.to(this.floorContainer, {
                        alpha: 1,
                        y: originalY,
                        duration: 0.5,
                        ease: "back.out(1)"
                    });
                }

                gsap.to(this.gridContainer, {
                    alpha: 1,
                    y: originalY, // float up to original
                    duration: 0.5,
                    ease: "back.out(1)",
                    onComplete: () => {
                        this.isProcessingSwipe = false;
                        this.updateRollbackUI();
                    }
                });
            }
        });
    }

    updateBackgroundHue(floor) {
        if (!this.bgFilter) return;

        this.bgFilter.reset();

        const themeIndex = Math.floor((floor - 1) / 5);

        switch (themeIndex % 4) {
            case 0:
                // Floor 1-5: Normal warm
                this.bgFilter.hue(0, false);
                break;
            case 1:
                // Floor 6-10: Jungle/Greenish
                this.bgFilter.hue(60, false);
                break;
            case 2:
                // Floor 11-15: Lava/Reddish
                this.bgFilter.hue(-60, false);
                break;
            case 3:
                // Floor 16-20: Dark Magic/Purple
                this.bgFilter.hue(120, false);
                break;
        }

        // Boss floor
        if (floor % 5 === 0) {
            this.bgFilter.brightness(0.75, true); // Just slightly darker for boss, no weird contrast
        } else {
            this.bgFilter.brightness(0.85, true); // slightly dim for readability
        }
    }

    getWorldPos(gridX, gridY) {
        const gridW = this.cols * this.cellSize;
        const gridH = this.rows * this.cellSize;
        const cartX = gridX * this.cellSize - gridW / 2 + this.cellSize / 2;
        const cartY = gridY * this.cellSize - gridH / 2 + this.cellSize / 2;
        return {
            x: cartX,
            y: cartY
        };
    }

    placeEntity(entity, gridX, gridY) {
        this.grid[gridY][gridX] = entity;
        entity.gridX = gridX;
        entity.gridY = gridY;

        const pos = this.getWorldPos(gridX, gridY);
        entity.position.set(pos.x, pos.y);
        this.gridContainer.addChild(entity);

        // Ensure player is always on top
        this.gridContainer.setChildIndex(this.player, this.gridContainer.children.length - 1);
    }

    async handleSwipe(direction) {
        if (this.destroyed || this.isProcessingSwipe || this.inputBlocked) return;
        if (!['up', 'down', 'left', 'right'].includes(direction)) return;

        let targetX = this.player.gridX;
        let targetY = this.player.gridY;

        if (direction === 'up') targetY -= 1;
        if (direction === 'down') targetY += 1;
        if (direction === 'left') targetX -= 1;
        if (direction === 'right') targetX += 1;

        // Check bounds
        if (targetX < 0 || targetX >= this.cols || targetY < 0 || targetY >= this.rows) {
            return;
        }

        // Check walls
        if (this.walls[targetY][targetX]) {
            this.statusText.text = 'Ô này đã sập. Chọn hướng khác hoặc hoàn tác.';
            return;
        }

        this.isProcessingSwipe = true;

        const targetEntity = this.grid[targetY][targetX];
        const snapshot = captureTurn(this);
        this.updateRollbackUI();

        const wPos = this.getWorldPos(targetX, targetY);

        if (!targetEntity) {
            // Empty cell, move
            this.grid[this.player.gridY][this.player.gridX] = null;
            this.player.gridX = targetX;
            this.player.gridY = targetY;
            this.grid[targetY][targetX] = this.player;

            AudioManager.playSwipeSFX();
            await this.player.moveTo(wPos.x, wPos.y);
            this.updateStatsUI();
        } else if (targetEntity.isItem) {
            // Collect item
            if (targetEntity.type === 'multiply') {
                this.player.multiplyPower(targetEntity.power);
                AudioManager.playLevelUpSFX();
                this.showFloatingText(wPos.x, wPos.y, `x${targetEntity.power}`, 0xFFD700);
            } else if (targetEntity.type === 'divide') {
                this.player.dividePower(targetEntity.power);
                AudioManager.playCollectSFX();
                this.showFloatingText(wPos.x, wPos.y, `/${targetEntity.power}`, 0x9C27B0);
            } else {
                this.player.absorbPower(targetEntity.power);
                AudioManager.playCollectSFX();
                const sign = targetEntity.power > 0 ? "+" : "";
                const color = targetEntity.power > 0 ? 0x00FF00 : 0xFF0000;
                this.showFloatingText(wPos.x, wPos.y, `${sign}${targetEntity.power}`, color);
            }
            await targetEntity.collect();

            this.grid[this.player.gridY][this.player.gridX] = null;
            this.player.gridX = targetX;
            this.player.gridY = targetY;
            this.grid[targetY][targetX] = this.player;

            await this.player.moveTo(wPos.x, wPos.y);
            this.updateStatsUI();
        } else if (targetEntity.isMonster) {
            // Combat
            AudioManager.playAttackSFX();
            await this.player.bump(direction, wPos.x, wPos.y);

            if (resolveEncounter(this.player.power, targetEntity).survives) {
                // Win! Absorb monster power
                this.player.absorbPower(targetEntity.power);
                this.showFloatingText(wPos.x, wPos.y, `+${targetEntity.power}`, 0x00FF00);
                const isBoss = targetEntity.isBoss;
                targetEntity.die();

                this.grid[this.player.gridY][this.player.gridX] = null;
                this.player.gridX = targetX;
                this.player.gridY = targetY;
                this.grid[targetY][targetX] = this.player;

                await this.player.moveTo(wPos.x, wPos.y);
                this.updateStatsUI();

                if (isBoss) {
                    AudioManager.playLevelUpSFX();
                    if (this.playVictoryEffect) this.playVictoryEffect(wPos.x, wPos.y);
                    this.moveHistory = [];
                    this.turnCount++;
                    this.updateStatsUI();
                    this.statusText.text = 'Đã thắng! Tầng tiếp theo bắt đầu với 10 sức mạnh.';
                    this.schedule(() => this.nextFloor(), 700);
                    return; // Input stays locked throughout the transition.
                }
            } else {
                // Record the failed attack itself: undo must restore this exact turn.
                this.moveHistory.push(snapshot);
                this.turnCount++;
                // Lose! (Retry puzzle floor)
                this.player.spendPower(this.player.power); // Zero out for effect
                this.showFloatingText(wPos.x, wPos.y, `Thất bại`, 0xFF0000);
                this.handleDefeat();
                return;
            }
        }

        this.moveHistory.push(snapshot);
        this.turnCount++;
        this.tileStates[snapshot.playerY][snapshot.playerX] = 2;
        this.walls[snapshot.playerY][snapshot.playerX] = true;

        this.updateStatsUI();
        if (this.player.power <= 0 || !hasSafeMove(this.grid, this.walls, this.player.gridX, this.player.gridY, this.player.power)) {
            this.handleDefeat(this.player.power <= 0 ? 'Bẫy đã làm sức mạnh về 0.' : 'Không còn nước đi an toàn.');
            return;
        }
        this.isProcessingSwipe = false;
        this.updateRollbackUI();
    }

    async handleRollback(fromDefeat = false) {
        const recovering = fromDefeat && this.inputBlocked && !!this.reviveCleanup;
        if (this.destroyed || this.rollbackBusy || !this.moveHistory.length
            || (!recovering && (this.isProcessingSwipe || this.inputBlocked))) return;

        this.isProcessingSwipe = true;
        const snapshot = this.moveHistory.at(-1);
        const revision = this.levelRevision;
        const paid = this.freeRollbacks <= 0;
        this.rollbackBusy = paid ? 'ad' : 'undo';
        if (recovering) this.reviveCleanup();
        this.updateRollbackUI();

        if (paid) {
            this.statusText.text = 'Đang chờ quảng cáo để hoàn tác 1 bước…';
            let success = false;
            try { success = await AdManager.showRewardedVideo(); } catch { /* Keep the turn available for retry. */ }
            if (this.destroyed || revision !== this.levelRevision) return;
            if (!success) {
                this.rollbackBusy = false;
                this.isProcessingSwipe = recovering;
                this.updateRollbackUI();
                if (recovering) this.showReviveOffer('Chưa nhận được lượt hoàn tác. Bạn có thể thử lại.');
                else this.statusText.text = 'Chưa nhận được lượt hoàn tác. Bàn cờ và lịch sử được giữ nguyên.';
                return;
            }
        }

        this.restoreTurn(snapshot);
        this.moveHistory.pop();
        if (!paid) this.freeRollbacks--;
        this.updateRollbackUI();
        this.inputBlocked = false;
        this.defeatReason = null;
        const pos = this.getWorldPos(snapshot.playerX, snapshot.playerY);
        await this.player.moveTo(pos.x, pos.y);
        if (this.destroyed || revision !== this.levelRevision) return;
        this.rollbackBusy = false;
        this.isProcessingSwipe = false;
        this.updateStatsUI();
        this.statusText.text = 'Đã lùi 1 bước · ' + this.moveHistory.length + ' bước trong lịch sử · ' + this.freeRollbacks + ' lượt miễn phí';
    }

    restoreTurn(snapshot) {
        this.clearBoardEntities();
        this.walls = snapshot.walls.map(row => [...row]);
        this.tileStates = snapshot.tileStates.map(row => [...row]);
        this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
        this.player.resetPower(snapshot.power);
        this.player.gridX = snapshot.playerX;
        this.player.gridY = snapshot.playerY;
        this.turnCount = snapshot.turnCount;
        this.grid[snapshot.playerY][snapshot.playerX] = this.player;
        for (const data of snapshot.entities) {
            const entity = data.kind === 'monster'
                ? new Monster(data.power, data.isBoss, data.texture) : new Item(data.power, data.itemType, data.texture);
            this.placeEntity(entity, data.x, data.y);
            if (data.isBoss) this.bossEntity = entity;
        }
        this.updateStatsUI();
    }

    clearBoardEntities() {
        const stop = node => {
            gsap.killTweensOf(node);
            gsap.killTweensOf(node.position);
            gsap.killTweensOf(node.scale);
            for (const child of node.children || []) stop(child);
        };
        for (const child of [...this.gridContainer.children]) {
            if (child === this.player) continue;
            stop(child);
            child.destroy({ children: true });
        }
        this.bossEntity = null;
    }

    handleRestart() {
        if (this.isProcessingSwipe) return;
        this.generateLevel(this.floor);
    }

    handleDefeat(reason = 'Cần sức mạnh lớn hơn đối thủ để thắng.') {
        this.inputBlocked = true;
        this.isProcessingSwipe = true;
        this.defeatReason = reason;
        this.updateStatsUI();
        AudioManager.playDefeatSFX();
        this.player.die();
        this.schedule(() => this.showReviveOffer(), 500);
    }

    showReviveOffer(message = '') {
        if (this.destroyed) return;
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100dvw;height:100dvh;background:rgba(0,0,0,0.75);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:10000;';

        const card = document.createElement('div');
        card.style.cssText = 'background:#ffffff;border-radius:28px;width:340px;padding:32px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;box-sizing:border-box;font-family:Be Vietnam Pro, sans-serif;box-shadow:0 20px 50px rgba(126,87,194,0.3);';

        const handleResize = () => {
            const scale = Math.min(1, (window.innerWidth - 24) / 340,
                (window.innerHeight - 24) / (card.offsetHeight || 520));
            card.style.transform = `scale(${scale})`;
        };
        window.addEventListener('resize', handleResize);

        card.innerHTML = `
        <style>
            @keyframes heartbeat {
                0% { transform: scale(1); }
                14% { transform: scale(1.25); }
                28% { transform: scale(1); }
                42% { transform: scale(1.25); }
                70% { transform: scale(1); }
            }
            .revive-title {
                color: #453268;
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 15px;
                letter-spacing: 0.5px;
            }
            .heart-icon {
                font-size: 90px;
                line-height: 1;
                margin-bottom: 22px;
                animation: heartbeat 1.4s infinite ease-in-out;
                filter: drop-shadow(0 8px 16px rgba(179,157,219,0.4));
            }
            .revive-3d-btn {
                width: 220px;
                height: 54px;
                border-radius: 27px;
                border: 3px solid #ffffff;
                background: linear-gradient(to bottom, #FF8A80, #E57373);
                box-shadow: 0 4px 0 #D32F2F, 0 8px 20px rgba(126,87,194,0.15);
                color: #ffffff;
                font-family:'Be Vietnam Pro', sans-serif;
                font-size: 22px;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                cursor: pointer;
                transition: transform 0.1s ease;
                margin-bottom: 16px;
                padding: 0;
            }
            .revive-3d-btn:active {
                transform: translateY(3px);
                box-shadow: 0 1px 0 #D32F2F, 0 3px 6px rgba(126,87,194,0.1);
            }
            .skip-btn-text {
                font-size: 14px;
                color: #7a7580;
                text-decoration: underline;
                cursor: pointer;
                font-weight: 600;
            }
            .skip-btn-text:hover {
                color: #453268;
            }
        </style>
        <div class="revive-title">${this.defeatReason}</div>
        <div class="heart-icon">💖</div>
        <button class="revive-3d-btn" id="btn-revive">
            <img src="/assest/iconbtn/images.png" style="height: 28px; width: auto;">
            CHƠI LẠI ↻
        </button>
        <div style="font-size:13px;color:#453268;margin-bottom:16px">Xem quảng cáo để chơi lại cùng bản đồ, với 10 sức mạnh.</div>
        ${message ? '<div style="font-size:13px;color:#8B3D2C;margin-bottom:12px">' + message + '</div>' : ''}
        ${this.moveHistory.length ? '<button id="btn-undo-defeat" style="padding:12px 20px;margin-bottom:16px;border-radius:20px;border:0;background:#EDE7F6;color:#453268;font:inherit;cursor:pointer">' + (this.freeRollbacks > 0 ? 'Hoàn tác · Còn ' + this.freeRollbacks + ' lượt miễn phí' : 'Xem QC · Hoàn tác 1 bước') + '</button>' : ''}
        <div class="skip-btn-text" id="btn-skip">Không, cảm ơn</div>
    `;

        overlay.appendChild(card);
        document.body.appendChild(overlay);
        handleResize();

        const cleanup = () => {
            window.removeEventListener('resize', handleResize);
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            this.reviveCleanup = null;
        };
        this.reviveCleanup = cleanup;

        const undoButton = overlay.querySelector('#btn-undo-defeat');
        if (undoButton) undoButton.onclick = () => this.handleRollback(true);

        document.getElementById('btn-revive').onclick = async () => {
            AudioManager.playClickSFX();
            cleanup();
            const success = await AdManager.showRewardedVideo();
            if (this.destroyed) return;
            if (success) {
                this.revivePlayer();
            } else {
                this.showGameOver();
            }
        };

        document.getElementById('btn-skip').onclick = () => {
            AudioManager.playClickSFX();
            cleanup();

            // Kick out animation then show game over
            this.player.kickOut(() => {
                this.showGameOver();
            });
        };
    }

    revivePlayer() {
        this.inputBlocked = false;
        this.player.resetPower(10);
        this.generateLevel(this.floor); // Restart current floor
    }

    showGameOver() {
        if (this.destroyed || this.gameOverStarted) return;
        this.gameOverStarted = true;
        // ── Wink: complete round + submit score ──
        if (this._winkRound) {
            winkGame.completeRound(this._winkRound, {
                metadata: { outcome: 'defeated', floor: this.floor },
            });
            if (winkGame.canSubmitScore) {
                winkGame.submitFinalScore({
                    score: this.floor,
                    playTime: Math.round((Date.now() - this._winkRound.startedAtMs) / 1000),
                    gameMode: 'adventure',
                }).catch(() => {});
            }
        }

        GameScene.defeatCount = (GameScene.defeatCount || 0) + 1;
        const processGameOver = async () => {
            if (GameScene.defeatCount >= 3) {
                GameScene.defeatCount = 0;
                await AdManager.showInterstitial();
            }
            if (this.destroyed) return;
            this.game.setScene(new GameOverScene(this.floor));
        };
        processGameOver();
    }

    openSettings() {
        if (this.settingsModal || this.isProcessingSwipe || this.inputBlocked) return;
        this.isProcessingSwipe = true;
        this.updateRollbackUI();
        this.settingsModal = new SettingsModal(
            () => {
                // onClose
                this.removeChild(this.settingsModal);
                this.settingsModal = null;
                this.isProcessingSwipe = false;
                if (this.statsBar) this.updateRollbackUI();
            },
            () => {
                // onRestart
                this.removeChild(this.settingsModal);
                this.settingsModal = null;
                this.isProcessingSwipe = false;
                if (this.statsBar) this.updateRollbackUI();
                this.player.resetPower(10);
                this.generateLevel(this.floor);
            },
            () => {
                // onHome
                this.removeChild(this.settingsModal);
                this.settingsModal = null;
                this.game.setScene(new MenuScene());
            }
        );
        this.settingsModal.resize(this.game.app.screen.width, this.game.app.screen.height);
        this.addChild(this.settingsModal);
    }


    updateRollbackUI() {
        this.statsBar.forceUpdateRollbacks(this.freeRollbacks, this.moveHistory.length,
            this.isProcessingSwipe || this.inputBlocked, this.rollbackBusy);
    }

    updateStatsUI() {
        if (this.statsBar) {
            this.statsBar.updateStats(this.floor, this.player.power);
            this.updateRollbackUI();
            this.statusText.text = 'Boss ' + this.levelLayout.bossPower + ' · Cần > ' + this.levelLayout.bossPower + ' · ' + this.turnCount + ' bước\nVuốt / phím mũi tên · Ô đỏ: nguy hiểm · Rời ô là sập';
            for (let y = 0; y < this.rows; y++) {
                for (let x = 0; x < this.cols; x++) this.updateCellVisuals(y, x);
            }
        }
    }

    showFloatingText(startX, startY, textMsg, color, flyToPlayer = true) {
        const txt = new Text({
            text: textMsg,
            style: new TextStyle({ fontFamily: "'Be Vietnam Pro', sans-serif", fill: color, fontSize: 28, fontWeight: '900', stroke: {color: 0xffffff, width: 5} })
        });
        txt.anchor.set(0.5);
        txt.position.set(startX, startY);
        this.gridContainer.addChild(txt);

        if (flyToPlayer) {
            // Fly towards player
            gsap.to(txt.position, {
                x: this.player.x,
                y: this.player.y - 40,
                duration: 0.8,
                ease: "power2.out"
            });
        } else {
            // Just float upwards
            gsap.to(txt.position, {
                y: startY - 40,
                duration: 0.8,
                ease: "power2.out"
            });
        }
        
        gsap.to(txt, {
            alpha: 0,
            duration: 0.8,
            ease: "power2.in",
            onComplete: () => {
                if (!txt.destroyed) txt.destroy();
            }
        });
    }

    schedule(callback, delay) {
        const timer = setTimeout(() => {
            this.sceneTimers.delete(timer);
            if (!this.destroyed) callback();
        }, delay);
        this.sceneTimers.add(timer);
    }

    destroy(options) {
        for (const timer of this.sceneTimers || []) clearTimeout(timer);
        this.moveHistory = [];
        this.levelTextures?.clear();
        this.reviveCleanup?.();
        const stopAnimations = node => {
            gsap.killTweensOf(node);
            gsap.killTweensOf(node.position);
            gsap.killTweensOf(node.scale);
            for (const child of node.children || []) stopAnimations(child);
        };
        stopAnimations(this);
        if (this.swipeManager) this.swipeManager.destroy();
        super.destroy(options);
    }

}
