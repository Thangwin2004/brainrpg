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
import gsap from 'gsap';

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
    
    this.floorContainer = new Container();
    this.addChild(this.floorContainer);

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
    const topMargin = isLandscape ? 20 : Math.max(32, height * 0.05);
    
    if (this.statsBar) {
      this.statsBar.resize(width, height);
      this.statsBar.position.y = topMargin;
    }
    
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
      
      const gridTotalW = this.baseCellSize * this.gridSize; 
      const gridTotalH = this.baseCellSize * this.gridSize;
      
      const scale = Math.min(maxGridPx / gridTotalW, availH / gridTotalH);
      
      this.gridContainer.scale.set(scale);
      if (this.floorContainer) {
          this.floorContainer.scale.set(scale);
      }
      
      let gridY = height * 0.62;
      const scaledGridHeight = gridTotalH * scale;
      
      const minGridY = headerH + gap + scaledGridHeight / 2;
      if (gridY < minGridY) gridY = minGridY;
      
      const maxGridY = height - bottomPad - scaledGridHeight / 2;
      if (gridY > maxGridY) gridY = maxGridY;
      
      this.gridContainer.position.set(width / 2, gridY);
      if (this.floorContainer) this.floorContainer.position.set(width / 2, gridY);
    }
    if (this.settingsModal) this.settingsModal.resize(width, height);
  }
  generateLevel(floor) {
    this.isProcessingSwipe = true;
    for (let i = this.gridContainer.children.length - 1; i >= 0; i--) {
        const child = this.gridContainer.children[i];
        if (child !== this.player) {
            this.gridContainer.removeChild(child);
            if (child.destroy && typeof child.destroy === 'function') {
                child.destroy({ children: true });
            }
        }
    }
    
    if (this.tutorialText) {
        this.removeChild(this.tutorialText);
        this.tutorialText.destroy();
        this.tutorialText = null;
    }
    
    let gs = 7;
    if (floor <= 5) gs = 5;
    else if (floor > 10) gs = 9;
    
    this.gridSize = gs;
    this.grid = Array(gs).fill(null).map(() => Array(gs).fill(null));
    this.walls = Array(gs).fill(null).map(() => Array(gs).fill(true)); 
    this.tileStates = Array(gs).fill(null).map(() => Array(gs).fill(0));
    this.cellGraphics = Array(gs).fill(null).map(() => Array(gs).fill(null));
    
    this.baseCellSize = 74;
    this.cellSize = this.baseCellSize;
    const gridW = this.baseCellSize * gs;
    this.gridOffsetX = -gridW / 2;
    this.gridOffsetY = -gridW / 2;
    
    this.resize(this.game.app.screen.width, this.game.app.screen.height);
    this.updateBackgroundHue(floor);
    
    const difficulty = Math.min(floor, 20);
    const pX = Math.floor(gs / 2);
    const pY = gs - 1;
    const bX = pX;
    const bY = 0;
    
    const paths = [];
    const allPathCells = [];
    
    if (floor <= 5) {
        paths.push(pX);
        const cells = [];
        for (let y = pY; y >= bY; y--) {
            this.walls[y][pX] = false;
            if (y > bY && y < pY) cells.push({x: pX, y: y});
        }
        allPathCells.push({ pathId: pX, cells: cells });
        
    } else if (floor <= 10) {
        for(let c=1; c<gs-1; c++) {
            this.walls[1][c] = false; 
            this.walls[gs-2][c] = false; 
        }
        paths.push(1, 3, 5);
        paths.forEach(px => {
            const cells = [];
            const dir = px > pX ? 1 : (px < pX ? -1 : 0);
            
            if (dir !== 0) {
                for (let x = pX + dir; x !== px; x += dir) cells.push({x: x, y: gs-2});
                cells.push({x: px, y: gs-2});
            }
            
            for(let y=gs-3; y>=1; y--) {
                this.walls[y][px] = false;
                if (y > 1) cells.push({x: px, y});
            }
            
            if (dir !== 0) {
                cells.push({x: px, y: 1});
                for (let x = px - dir; x !== pX; x -= dir) cells.push({x: x, y: 1});
            } else {
                cells.push({x: px, y: 1});
            }
            
            allPathCells.push({ pathId: px, cells });
        });
        this.walls[pY][pX] = false;
        this.walls[bY][bX] = false;
    } else {
        for(let c=1; c<gs-1; c++) {
            this.walls[1][c] = false; 
            this.walls[gs-2][c] = false; 
        }
        paths.push(1, 4, 7);
        const domains = {
            1: {min: 0, max: 2},
            4: {min: 4, max: 4},
            7: {min: 6, max: 8}
        };
        
        paths.forEach(px => {
            const cells = [];
            const dir = px > pX ? 1 : (px < pX ? -1 : 0);
            
            if (dir !== 0) {
                for (let x = pX + dir; x !== px; x += dir) cells.push({x: x, y: gs-2});
                cells.push({x: px, y: gs-2});
            }
            
            let currX = px;
            let currY = gs-3;
            cells.push({x: currX, y: currY});
            
            while(currY > 1) {
                const dom = domains[px];
                const nextX = Math.floor(Math.random() * (dom.max - dom.min + 1)) + dom.min;
                const moveDir = nextX > currX ? 1 : (nextX < currX ? -1 : 0);
                
                while(currX !== nextX) {
                    currX += moveDir;
                    cells.push({x: currX, y: currY});
                }
                
                currY--;
                if (currY >= 1) cells.push({x: currX, y: currY});
            }
            
            if (dir !== 0) {
                const moveDir = pX > currX ? 1 : (pX < currX ? -1 : 0);
                while(currX !== pX) {
                    currX += moveDir;
                    if (currX !== pX) {
                        cells.push({x: currX, y: 1});
                    }
                }
            }
            
            allPathCells.push({ pathId: px, cells });
        });
        this.walls[pY][pX] = false;
        this.walls[bY][bX] = false;
    }
    
    allPathCells.forEach(pData => {
        pData.cells.forEach(c => {
            if (c.y > 0 && c.y < gs-1) this.walls[c.y][c.x] = false;
        });
    });
    
    const bossBasePower = 15 + floor * 5;
    const truePathId = paths[Math.floor(Math.random() * paths.length)];
    
    allPathCells.forEach(pData => {
        const pathX = pData.pathId;
        const cells = pData.cells;
        const L = cells.length;
        const bFinal = bossBasePower + L;
        
        if (pathX === truePathId) {
            const powerNeeded = bFinal + 2 - 10;
            const slots = cells.length;
            let rem = powerNeeded;
            
            const validSlots = Math.max(1, Math.floor((slots - 1) * (0.4 + Math.random() * 0.3)));
            const activeEntities = [];
            
            for(let i=0; i<validSlots; i++) {
                const val = Math.max(2, Math.floor(rem / (validSlots-i) * (0.8 + Math.random()*0.4)));
                if (i < validSlots/2) activeEntities.push({type: 'add', power: val});
                else activeEntities.push({type: 'monster', power: Math.max(1, val)});
                rem -= val;
            }
            activeEntities.sort((a,b) => { if(a.type!=='monster' && b.type==='monster') return -1; if(a.type==='monster' && b.type!=='monster') return 1; return 0; });
            
            while(activeEntities.length < slots - 1) {
                const insertIdx = Math.floor(Math.random() * (activeEntities.length + 1));
                activeEntities.splice(insertIdx, 0, null);
            }
            activeEntities.push({type: 'monster', power: Math.max(1, rem)});
            
            cells.forEach((c, i) => {
                const eq = activeEntities[i];
                if (eq) {
                    if (eq.type === 'monster') this.placeEntity(new Monster(eq.power, false), c.x, c.y);
                    else this.placeEntity(new Item(eq.power, eq.type), c.x, c.y);
                }
            });
        } else {
            const trapType = Math.random();
            if (trapType < 0.33 && cells.length >= 3) {
                cells.forEach((c, i) => {
                    if (i === 0) this.placeEntity(new Item(2, 'multiply'), c.x, c.y);
                    else if (i === Math.floor(cells.length/2)) this.placeEntity(new Monster(999, false), c.x, c.y);
                    else if (Math.random() > 0.5) this.placeEntity(new Item(2, 'add'), c.x, c.y);
                });
            } else if (trapType < 0.66 && cells.length >= 3) {
                cells.forEach((c, i) => {
                    if (i === Math.floor(cells.length/2)) this.placeEntity(new Item(2, 'divide'), c.x, c.y);
                    else if (Math.random() > 0.5) this.placeEntity(new Item(3, 'add'), c.x, c.y);
                });
            } else {
                const fakePowerNeeded = bFinal - 5 - 10; 
                const slots = cells.length;
                let rem = Math.max(slots * 2, fakePowerNeeded);
                const validSlots = Math.max(1, Math.floor((slots - 1) * (0.4 + Math.random() * 0.3)));
                const activeEntities = [];
                for(let i=0; i<validSlots; i++) {
                    const val = Math.max(2, Math.floor(rem / (validSlots-i)));
                    activeEntities.push({type: 'add', power: val});
                    rem -= val;
                }
                while(activeEntities.length < slots - 1) {
                    const insertIdx = Math.floor(Math.random() * (activeEntities.length + 1));
                    activeEntities.splice(insertIdx, 0, null);
                }
                activeEntities.push({type: 'monster', power: Math.max(1, rem)});
                
                cells.forEach((c, i) => {
                    const eq = activeEntities[i];
                    if (eq) {
                        if (eq.type === 'monster') this.placeEntity(new Monster(eq.power, false), c.x, c.y);
                        else this.placeEntity(new Item(eq.power, eq.type), c.x, c.y);
                    }
                });
            }
        }
    });
    
    for(let r = 0; r < gs; r++) {
      for(let c = 0; c < gs; c++) {
        const cell = new Graphics();
        const size = this.cellSize + 0.5; // slight overlap to prevent seams
        const offset = -size / 2;
        if (this.walls[r][c]) {
            cell.roundRect(offset, offset, size, size, 14)
                .fill({ color: 0x546E7A })
                .stroke({ color: 0x37474F, width: 2 });
        } else {
            const isBossCell = (r === bY && c === bX);
            const cellColor = isBossCell ? 0xFFF3E0 : 0xF3F3F4;
            cell.roundRect(offset, offset, size, size, 14)
                .fill({ color: cellColor })
                .stroke({ color: 0xCBC4D0, width: 1 });
        }
        const gridW = this.gridSize * this.cellSize;
        cell.position.set(c * this.cellSize - gridW / 2 + this.cellSize / 2, r * this.cellSize - gridW / 2 + this.cellSize / 2);
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
    
    this.bossEntity = new Monster(bossBasePower, true);
    this.placeEntity(this.bossEntity, bX, bY);
    
    this.lastMove = null;
    this.updateStatsUI();
    if (this.lastMove) {
        const prevX = this.lastMove.prevX;
        const prevY = this.lastMove.prevY;
        this.tileStates[prevY][prevX] = 2; 
        this.walls[prevY][prevX] = true;
        this.updateCellVisuals(prevY, prevX);
    }
    
    this.lastMove = null;
    this.updateStatsUI();
    if (floor === 1) {
        this.isProcessingSwipe = true; // Keep it true to block swipe
        const { width, height } = this.game.app.screen;
        const modal = new TutorialModal(width, height, () => {
            this.isProcessingSwipe = false;
        });
        this.addChild(modal);
    } else {
        this.isProcessingSwipe = false;
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
        cell.roundRect(offset, offset, size, size, 14)
            .fill({ color: 0xF3F3F4 })
            .stroke({ color: 0xCBC4D0, width: 1 });
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
  
  updateStatsUI() {
    this.statsBar.updateStats(this.floor, this.player.power);
    if (this.statsBar.forceUpdateRollbacks) {
        this.statsBar.forceUpdateRollbacks(this.freeRollbacks, !!this.lastMove);
    } else {
        console.error("CRITICAL ERROR: StatsBar does not have forceUpdateRollbacks! Browser is running cached code!");
    }
  }
  
  getWorldPos(gridX, gridY) {
    const gridW = this.gridSize * this.cellSize;
    const cartX = gridX * this.cellSize - gridW / 2 + this.cellSize / 2;
    const cartY = gridY * this.cellSize - gridW / 2 + this.cellSize / 2;
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
    if (this.bossEntity && !this.bossEntity.destroyed && targetEntity !== this.bossEntity) {
        this.bossEntity.power += 1;
        this.bossEntity.updatePowerBadge();
        if (this.showFloatingText) this.showFloatingText(this.bossEntity, "+1", 0xFF0000);
    }
    
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
    } else if (targetEntity.constructor.name === 'Item') {
      // Collect item
      if (targetEntity.type === 'multiply') {
          this.player.multiplyPower(targetEntity.power);
          AudioManager.playLevelUpSFX();
      } else if (targetEntity.type === 'divide') {
          this.player.dividePower(targetEntity.power);
          AudioManager.playCollectSFX();
      } else {
          this.player.absorbPower(targetEntity.power);
          AudioManager.playCollectSFX();
      }
      await targetEntity.collect();
      
      this.grid[this.player.gridY][this.player.gridX] = null;
      this.player.gridX = targetX;
      this.player.gridY = targetY;
      this.grid[targetY][targetX] = this.player;
      
      await this.player.moveTo(wPos.x, wPos.y);
      this.updateStatsUI();
    } else if (targetEntity.constructor.name === 'Monster') {
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
              if (this.playVictoryEffect) this.playVictoryEffect(wPos.x, wPos.y);
              setTimeout(() => this.nextFloor(), 1300);
          }
      } else {
          // Lose! (Retry puzzle floor)
          this.handleDefeat();
          return;
      }
    }
    
    if (this.lastMove) {
        const prevX = this.lastMove.prevX;
        const prevY = this.lastMove.prevY;
        this.tileStates[prevY][prevX] = 2; 
        this.walls[prevY][prevX] = true;
        this.updateCellVisuals(prevY, prevX);
    }
    
    this.lastMove = null;
    this.updateStatsUI();
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
        
        // Kick out animation then show game over
        this.player.kickOut(() => {
            this.showGameOver();
        });
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
