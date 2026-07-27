import { Container, Graphics, FillGradient, Sprite, Assets, ColorMatrixFilter, BlurFilter } from 'pixi.js';
import { Player } from '../entities/Player.js';
import { Monster } from '../entities/Monster.js';
import { Item } from '../entities/Item.js';
import { SwipeManager } from '../managers/SwipeManager.js';
import { StatsBar } from '../ui/StatsBar.js';
import { AdManager } from '../managers/AdManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { GameOverScene } from './GameOverScene.js';
import { SettingsModal } from '../ui/SettingsModal.js';
import { MenuScene } from './MenuScene.js';

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
    this.isProcessingSwipe = false;
    this.freeRollbacks = 3;
    
    this.gridContainer = new Container();
    this.addChild(this.gridContainer);
    
    // UI
    this.statsBar = new StatsBar(width, this.openSettings.bind(this));
    this.statsBar.onRollback = this.handleRollback.bind(this);
    this.addChild(this.statsBar);
    
    // Swipe Manager
    this.swipeManager = new SwipeManager(game.app, this.handleSwipe.bind(this));
    
    // Initialize Player (Keeps power across floors)
    this.player = new Player();
    this.gridContainer.addChild(this.player);
    
    this.generateLevel(this.floor);
  }
  
  resize(width, height) {
    // Resize Blurred background (Always Cover)
    if (this.bgBlurredImage && this.bgBlurredImage.texture) {
        this.bgBlurredImage.position.set(width / 2, height / 2);
        this.bgBlurredImage.scale.set(Math.max(width / this.bgBlurredImage.texture.width, height / this.bgBlurredImage.texture.height));
    }
    
    // Resize Main background (Contain on PC, Cover on Mobile)
    if (this.bgImage && this.bgImage.texture) {
        const isLandscape = width > height;
        const scale = isLandscape 
            ? Math.min(width / this.bgImage.texture.width, height / this.bgImage.texture.height)
            : Math.max(width / this.bgImage.texture.width, height / this.bgImage.texture.height);
        this.bgImage.position.set(width / 2, height / 2);
        this.bgImage.scale.set(scale);
    }
    
    const isLandscape = width > height;
    // 1. Determine safe top margin (Push down from the very top of the screen)
    const topMargin = isLandscape ? 20 : Math.max(32, height * 0.05);
    
    if (this.statsBar) {
      this.statsBar.resize(width, height);
      this.statsBar.position.y = topMargin;
    }
    
    // 2. Reposition and scale gridContainer
    if (this.gridSize) {
      const headerH = (this.statsBar ? this.statsBar.totalHeight : 100) + topMargin;
      const gap = isLandscape ? 16 : Math.max(24, height * 0.04);
      const bottomPad = isLandscape ? 40 : 20; 
      const availH = height - headerH - gap - bottomPad;
      
      let maxGridPx;
      if (isLandscape) {
          const bgW = this.bgImage.texture.width * this.bgImage.scale.x;
          const sidePad = Math.max(12, bgW * 0.04);
          maxGridPx = Math.min(bgW - sidePad * 2, availH);
      } else {
          const sidePad = Math.max(12, width * 0.04);
          maxGridPx = Math.min(width - sidePad * 2, availH);
      }
      
      const gridTotalW = this.baseCellSize * this.gridSize + 20; 
      
      const scale = maxGridPx / gridTotalW;
      const scaledGridSize = gridTotalW * scale;
      
      this.gridContainer.scale.set(scale);
      
      // Center the grid perfectly inside the background's dark portal
      let gridY = height * 0.52;
      
      // Safety check to ensure it doesn't overlap the header on tiny/short screens
      const minGridY = headerH + gap + scaledGridSize / 2;
      if (gridY < minGridY) {
          gridY = minGridY;
      }
      
      this.gridContainer.position.set(width / 2, gridY);
    }
    
    if (this.settingsModal) {
      this.settingsModal.resize(width, height);
    }
  }
  
  generateLevel(floor) {
    this.isProcessingSwipe = true;
    // Clear grid contents (except player)
    for (let i = this.gridContainer.children.length - 1; i >= 0; i--) {
        const child = this.gridContainer.children[i];
        if (child !== this.player) {
            this.gridContainer.removeChild(child);
            if (child.destroy && typeof child.destroy === 'function') {
                child.destroy({ children: true });
            }
        }
    }
    
    this.gridSize = Math.min(5 + Math.floor(floor / 3), 7);
    this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
    this.walls = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(true)); 
    
    // Base logical sizing for grid elements
    this.baseCellSize = 74;
    this.cellSize = this.baseCellSize;
    const gridW = this.baseCellSize * this.gridSize;
    this.gridOffsetX = -gridW / 2;
    this.gridOffsetY = -gridW / 2;
    
    // Apply immediate resize to layout gridContainer correctly on new floor
    this.resize(this.game.app.screen.width, this.game.app.screen.height);
    this.updateBackgroundHue(floor);
    
    // === DIFFICULTY ===
    const difficulty = Math.min(floor, 20);
    
    // === 1. PATH LAYOUT — Horizontal corridor + vertical branches ===
    const gs = this.gridSize;
    const midY = Math.floor(gs / 2);
    
    // Main corridor: horizontal across the middle row
    const corridorLen = Math.min(gs, 3 + Math.floor(floor * 0.4));
    const mainPath = [];
    for (let x = 0; x < corridorLen; x++) {
      mainPath.push({x, y: midY});
      this.walls[midY][x] = false;
    }
    
    // Side branches: dead-end cells above/below the main corridor
    // These are the PUZZLE CHOICES — each contains an item OR a monster
    const branches = [];
    const branchSlots = []; // which main path cells have branches
    
    // Number of branches scales with floor (more choices = harder puzzle)
    const numBranches = Math.min(2 + Math.floor(floor / 3), Math.min(corridorLen - 2, 6));
    
    // Pick fork points on main path (not start, not boss cell)
    const availableForks = [];
    for (let i = 1; i < corridorLen - 1; i++) {
      availableForks.push(i);
    }
    // Shuffle
    for (let i = availableForks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableForks[i], availableForks[j]] = [availableForks[j], availableForks[i]];
    }
    
    let branchCount = 0;
    for (let i = 0; i < availableForks.length && branchCount < numBranches; i++) {
      const forkX = availableForks[i];
      
      // Try up first, then down
      const directions = Math.random() < 0.5 ? [-1, 1] : [1, -1];
      for (const dy of directions) {
        const by = midY + dy;
        if (by >= 0 && by < gs && this.walls[by][forkX]) {
          this.walls[by][forkX] = false;
          branches.push({x: forkX, y: by});
          branchCount++;
          
          // On higher floors, add 2-cell deep branches (monster → item)
          if (floor >= 4 && Math.random() < 0.3) {
            const by2 = by + dy;
            if (by2 >= 0 && by2 < gs && this.walls[by2][forkX]) {
              this.walls[by2][forkX] = false;
              branches.push({x: forkX, y: by2, deep: true, parentIdx: branches.length - 1});
              branchCount++;
            }
          }
          break;
        }
      }
    }
    
    // === 2. ENTITY GENERATION — Tight Absorption Balance ===
    // Mechanic: Items +power, Monsters defeated +power (absorbed)
    // TIGHT: 10 + sum(all items) + sum(all monsters) = boss + small margin
    // ORDER matters: must collect items BEFORE fighting strong corridor monsters
    
    const bossCell = mainPath[corridorLen - 1];
    const mainSlots = mainPath.slice(1, -1);
    const shallowBranches = branches.filter(b => !b.deep);
    
    // Boss power scales with floor
    const bossPower = 15 + floor * 5 + Math.floor(difficulty * difficulty * 0.2);
    
    // Margin: how much ABOVE boss the player ends at after collecting EVERYTHING
    // Floor 1: ~15% margin (forgiving), Floor 20: ~2% margin (very tight!)
    const marginPct = Math.max(0.02, 0.15 - difficulty * 0.0065);
    const margin = Math.max(1, Math.floor(bossPower * marginPct));
    
    // Total entity power budget = boss + margin - startPower(10)
    const totalBudget = bossPower + margin - 10;
    
    // How many of each type
    const totalSlots = mainSlots.length + shallowBranches.length;
    const numMonsters = Math.max(1, Math.floor(totalSlots * 0.4));
    const numItems = Math.max(1, totalSlots - numMonsters);
    
    // Split budget: items ~55%, monsters ~45%
    const itemBudget = Math.floor(totalBudget * 0.55);
    const monsterBudget = totalBudget - itemBudget;
    
    // Generate item values (distributed with some variance)
    const itemEntities = [];
    let remItem = itemBudget;
    for (let i = 0; i < numItems; i++) {
      if (i === numItems - 1) {
        itemEntities.push({ type: 'add', power: Math.max(2, remItem) });
      } else {
        const avg = remItem / (numItems - i);
        const val = Math.max(2, Math.floor(avg * (0.75 + Math.random() * 0.5)));
        itemEntities.push({ type: 'add', power: val });
        remItem -= val;
      }
    }
    
    // Generate monster values (must be beatable in correct order)
    const monsterEntities = [];
    let remMon = monsterBudget;
    for (let i = 0; i < numMonsters; i++) {
      if (i === numMonsters - 1) {
        monsterEntities.push({ type: 'monster', power: Math.max(1, remMon) });
      } else {
        const avg = remMon / (numMonsters - i);
        const val = Math.max(1, Math.floor(avg * (0.75 + Math.random() * 0.5)));
        monsterEntities.push({ type: 'monster', power: val });
        remMon -= val;
      }
    }
    
    // === PLACEMENT STRATEGY ===
    // Items → branches first (player must detour to collect)
    // Items overflow → early main path cells
    // Monsters → later main path cells (gates needing items first)
    // Creates ORDER puzzle: get items from branches → fight corridor monsters → boss
    
    const mainEntities = [];
    const branchEntityMap = new Map();
    
    let itemIdx = 0;
    
    // Place items in branches first (forces detour)
    for (const branch of shallowBranches) {
      if (itemIdx < itemEntities.length) {
        branchEntityMap.set(`${branch.x},${branch.y}`, itemEntities[itemIdx++]);
      }
    }
    
    // Remaining items go to early main path, then monsters after
    for (; itemIdx < itemEntities.length; itemIdx++) {
      mainEntities.push(itemEntities[itemIdx]);
    }
    for (const monster of monsterEntities) {
      mainEntities.push(monster);
    }
    
    // Deep branches: small bonus item guarded by gate monster
    branches.filter(b => b.deep).forEach(branch => {
      const bonusVal = Math.max(1, Math.floor(margin * 0.5));
      branchEntityMap.set(`${branch.x},${branch.y}`, { type: 'add', power: bonusVal });
      const parent = branches[branch.parentIdx];
      const parentKey = `${parent.x},${parent.y}`;
      if (!branchEntityMap.has(parentKey)) {
        branchEntityMap.set(parentKey, { type: 'monster', power: Math.max(1, Math.floor(bonusVal * 0.7)) });
      }
    });
    
    // === 3. DRAW GRID & PLACE ENTITIES ===
    // Draw Grid Card
    const frameShadow = new Graphics()
      .roundRect(this.gridOffsetX - 10, this.gridOffsetY - 5, gridW + 20, gridW + 20, 24)
      .fill({ color: 0x000000, alpha: 0.1 });
    this.gridContainer.addChild(frameShadow);
      
    const outerFrame = new Graphics()
      .roundRect(this.gridOffsetX - 10, this.gridOffsetY - 10, gridW + 20, gridW + 20, 24)
      .fill({ color: 0xFFFFFF, alpha: 1 })
      .stroke({ color: 0xF3E5F5, width: 3 }); // bright highlight border
    this.gridContainer.addChild(outerFrame);

    // Draw Grid Cells
    for(let r = 0; r < this.gridSize; r++) {
      for(let c = 0; c < this.gridSize; c++) {
        const cell = new Graphics();
        if (this.walls[r][c]) {
           cell.roundRect(0, 0, this.cellSize - 4, this.cellSize - 4, 14)
               .fill({ color: 0xE8E8E8 })
               .stroke({ color: 0xCBC4D0, width: 1 });
        } else {
            // Check if boss cell for custom fill color
            const isBossCell = (r === bossCell.y && c === bossCell.x);
            const cellColor = isBossCell ? 0xFFF3E0 : 0xF3F3F4; // warm pastel orange for boss

           cell.roundRect(0, 0, this.cellSize - 4, this.cellSize - 4, 14)
               .fill({ color: cellColor })
               .stroke({ color: 0xCBC4D0, width: 1 });
        }
        cell.position.set(this.gridOffsetX + c * this.cellSize + 2, this.gridOffsetY + r * this.cellSize + 2);
        this.gridContainer.addChild(cell);
      }
    }
    
    // Place Player at start
    this.player.resetPower(10);
    this.player.gridX = 0;
    this.player.gridY = midY;
    const startPos = this.getWorldPos(0, midY);
    this.player.position.set(startPos.x, startPos.y);
    this.grid[midY][0] = this.player;
    this.gridContainer.setChildIndex(this.player, this.gridContainer.children.length - 1);
    
    // Place Boss
    this.placeEntity(new Monster(bossPower, true), bossCell.x, bossCell.y);
    
    // Place main path entities in order
    for (let i = 0; i < mainEntities.length && i < mainSlots.length; i++) {
        const eq = mainEntities[i];
        const pos = mainSlots[i];
        if (eq.type === 'monster') {
            this.placeEntity(new Monster(eq.power, false), pos.x, pos.y);
        } else {
            this.placeEntity(new Item(eq.power, eq.type), pos.x, pos.y);
        }
    }
    
    // Place branch entities
    for (const branch of branches) {
      const key = `${branch.x},${branch.y}`;
      const eq = branchEntityMap.get(key);
      if (eq) {
        if (eq.type === 'monster') {
          this.placeEntity(new Monster(eq.power, false), branch.x, branch.y);
        } else {
          this.placeEntity(new Item(eq.power, eq.type), branch.x, branch.y);
        }
      }
    }
    
    this.lastMove = null;
    this.updateStatsUI();
    this.isProcessingSwipe = false;
  }
  
  nextFloor() {
      this.floor++;
      this.generateLevel(this.floor);
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
          this.bgFilter.brightness(0.6, true);
          this.bgFilter.contrast(1.2, true);
      } else {
          this.bgFilter.brightness(0.85, true); // slightly dim for readability
      }
  }
  
  updateStatsUI() {
    this.statsBar.updateStats(this.floor, this.player.power);
    if (this.statsBar.forceUpdateRollbacks) {
        this.statsBar.forceUpdateRollbacks(this.freeRollbacks, !!this.lastMove);
    } else {
        console.error("CRITICAL ERROR: StatsBar does not have forceUpdateRollbacks! Browser is running cached code!");
    }
  }
  
  getWorldPos(gridX, gridY) {
    return {
      x: this.gridOffsetX + gridX * this.cellSize + this.cellSize / 2,
      y: this.gridOffsetY + gridY * this.cellSize + this.cellSize / 2
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
    if (this.isProcessingSwipe) return;
    
    let targetX = this.player.gridX;
    let targetY = this.player.gridY;
    
    if (direction === 'up') targetY -= 1;
    if (direction === 'down') targetY += 1;
    if (direction === 'left') targetX -= 1;
    if (direction === 'right') targetX += 1;
    
    // Check bounds
    if (targetX < 0 || targetX >= this.gridSize || targetY < 0 || targetY >= this.gridSize) {
      return;
    }
    
    // Check walls
    if (this.walls[targetY][targetX]) {
      return; // Bonk!
    }
    
    this.isProcessingSwipe = true;
    
    const targetEntity = this.grid[targetY][targetX];
    
    // Save state for rollback
    this.lastMove = {
       prevX: this.player.gridX,
       prevY: this.player.gridY,
       targetX, targetY,
       prevPower: this.player.power,
       entityData: targetEntity ? {
          type: targetEntity instanceof Monster ? 'monster' : 'item',
          power: targetEntity.power,
          itemType: targetEntity.type,
          isBoss: targetEntity.isBoss
       } : null
    };
    
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
    } else if (targetEntity instanceof Item) {
      // Collect item
      if (targetEntity.type === 'multiply') {
          this.player.multiplyPower(targetEntity.power);
          AudioManager.playLevelUpSFX();
      } else {
          this.player.absorbPower(targetEntity.power);
          AudioManager.playCollectSFX();
      }
      targetEntity.collect();
      
      this.grid[this.player.gridY][this.player.gridX] = null;
      this.player.gridX = targetX;
      this.player.gridY = targetY;
      this.grid[targetY][targetX] = this.player;
      
      await this.player.moveTo(wPos.x, wPos.y);
      this.updateStatsUI();
    } else if (targetEntity instanceof Monster) {
      // Combat
      AudioManager.playAttackSFX();
      await this.player.bump(direction, wPos.x, wPos.y);
      
      if (this.player.power > targetEntity.power) {
          // Win! Absorb monster power
          this.player.absorbPower(targetEntity.power);
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
              setTimeout(() => this.nextFloor(), 600);
          }
      } else {
          // Lose! (Retry puzzle floor)
          this.handleDefeat();
          return;
      }
    }
    
    this.isProcessingSwipe = false;
  }
  
  async handleRollback() {
    if (this.isProcessingSwipe || !this.lastMove || this.inputBlocked) return;
    
    this.isProcessingSwipe = true;
    const move = this.lastMove;
    
    // Check if player has free rollbacks or needs to watch ad
    if (this.freeRollbacks > 0) {
      this.freeRollbacks--;
    } else {
      const adSuccess = await AdManager.showRewardedVideo();
      if (!adSuccess) {
        this.isProcessingSwipe = false;
        return;
      }
    }
    
    // Restore Player Stats
    this.player.resetPower(move.prevPower);
    
    // Move Player Back visually and logically
    this.grid[this.player.gridY][this.player.gridX] = null;
    this.player.gridX = move.prevX;
    this.player.gridY = move.prevY;
    this.grid[this.player.gridY][this.player.gridX] = this.player;
    
    const wPos = this.getWorldPos(move.prevX, move.prevY);
    await this.player.moveTo(wPos.x, wPos.y);
    
    // Restore the entity if there was one
    if (move.entityData) {
      const data = move.entityData;
      let entity;
      if (data.type === 'monster') {
        entity = new Monster(data.power, data.isBoss);
      } else {
        entity = new Item(data.power, data.itemType);
      }
      this.placeEntity(entity, move.targetX, move.targetY);
    } else {
      this.grid[move.targetY][move.targetX] = null;
    }
    
    // Can only undo one step at a time
    this.lastMove = null;
    
    this.updateStatsUI();
    this.isProcessingSwipe = false;
  }
  
  handleDefeat() {
    this.inputBlocked = true;
    AudioManager.playDefeatSFX();
    this.player.die();
    setTimeout(() => {
        this.showReviveOffer();
    }, 800);
  }

  showReviveOffer() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100dvw;height:100dvh;background:rgba(0,0,0,0.75);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:10000;';

    const card = document.createElement('div');
    card.style.cssText = 'background:#ffffff;border-radius:28px;width:340px;padding:32px 24px;display:flex;flex-direction:column;align-items:center;text-align:center;box-sizing:border-box;font-family:Quicksand,"Be Vietnam Pro",sans-serif;box-shadow:0 20px 50px rgba(126,87,194,0.3);';

    const handleResize = () => {
      const scale = Math.min(1.0, (window.innerWidth - 30) / 360, (window.innerHeight - 30) / 520);
      card.style.transform = `scale(${scale})`;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

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
                font-family: Quicksand,'Be Vietnam Pro',sans-serif;
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
        <div class="revive-title">BẠN CÓ MUỐN HỒI SINH KHÔNG?</div>
        <div class="heart-icon">💖</div>
        <button class="revive-3d-btn" id="btn-revive">
            <img src="/assest/iconbtn/images.png" style="height: 28px; width: auto;">
            CÓ
        </button>
        <div class="skip-btn-text" id="btn-skip">Không, cảm ơn</div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const cleanup = () => {
      window.removeEventListener('resize', handleResize);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    document.getElementById('btn-revive').onclick = async () => {
        AudioManager.playClickSFX();
        cleanup();
        const success = await AdManager.showRewardedVideo();
        if (success) {
            this.revivePlayer();
        } else {
            this.showGameOver();
        }
    };

    document.getElementById('btn-skip').onclick = () => {
        AudioManager.playClickSFX();
        cleanup();
        this.showGameOver();
    };
  }

  revivePlayer() {
    this.inputBlocked = false;
    this.generateLevel(this.floor); // Restart current floor
  }

  showGameOver() {
    GameScene.defeatCount = (GameScene.defeatCount || 0) + 1;
    const processGameOver = async () => {
        if (GameScene.defeatCount >= 3) {
            GameScene.defeatCount = 0;
            await AdManager.showInterstitial();
        }
        this.game.setScene(new GameOverScene(this.floor));
    };
    processGameOver();
  }
  
  openSettings() {
    if (this.settingsModal) return;
    this.isProcessingSwipe = true;
    this.settingsModal = new SettingsModal(
      () => {
        // onClose
        this.removeChild(this.settingsModal);
        this.settingsModal = null;
        this.isProcessingSwipe = false;
      },
      () => {
        // onRestart
        this.removeChild(this.settingsModal);
        this.settingsModal = null;
        this.isProcessingSwipe = false;
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


  updateStatsUI() {
    this.statsBar.updateStats(this.floor, this.player.power);
  }
  
  destroy(options) {
    if (this.swipeManager) this.swipeManager.destroy();
    super.destroy(options);
  }
}
