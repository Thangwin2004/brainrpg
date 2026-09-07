import { Assets } from 'pixi.js';
import { AudioManager } from './AudioManager.js';

export const AVATAR_FILES = [
  "001_avatar_laclac.webp",
  "002_avatar_cat_lick1.webp",
  "003_avatar_duck.webp",
  "004_avatar_turtle.webp",
  "005_avatar_long.webp",
  "006_avatar_horse.webp",
  "007_avatar_tiguawhite.webp",
  "008_avatar_husky.webp",
  "009_avatar_doremonk.webp",
  "010_avatar_echxanh1.webp",
  "011_avatar_nudaeng.webp",
  "012_avatar_hubcat.webp",
  "013_avatar_unicorn.webp",
  "014_avatar_zongbadou.webp",
  "015_avatar_dauLan.webp",
  "016_avatar_banhtung.webp",
  "017_avatar_tiguayel.webp",
  "018_avatar_megachard.webp",
  "019_avatar_gigaboy.webp",
  "020_avatar_cloudball.webp",
  "021_avatar_culama.webp",
  "022_avatar_poolpanda.webp",
  "023_avatar_trollvn.webp",
  "024_avatar_heothy.webp",
  "025_avatar_zolype.webp",
  "026_avatar_crick.webp",
  "027_avatar_penguine.webp",
  "028_avatar_timao.webp",
  "029_avatar_caocal.webp",
  "030_avatar_cowboy.webp",
  "031_avatar_ninjadog.webp",
  "032_avatar_petrocat.webp",
  "033_avatar_richmonkey.webp",
  "034_avatar_hazagi.webp",
  "035_avatar_dogoin.webp",
  "036_avatar_watermelon.webp",
  "037_avatar_timone.webp",
  "038_avatar_ronaldo.webp",
  "039_avatar_hustmouse.webp",
  "040_avatar_hitbear.webp",
  "041_avatar_echxanh2.webp",
  "042_avatar_zolype2.webp",
  "043_avatar_cat_lick2.webp",
  "044_avatar_poolpanda2.webp"
];

export const ITEM_FILES = [
  "reddrink.webp",
  "banhmi.webp",
  "BimBim_02.webp",
  "BanhChungBanhTet (1).webp",
  "Lycaphe.webp"
];

export const MAIN_CHAR_FILE = "010_avatar_echxanh1.webp";

export class AssetManager {
  static gameplayLoadPromise = null;

  static async init(onProgress) {
    const manifest = {
      bundles: [
        {
          name: 'gameplay',
          assets: AVATAR_FILES.map(file => ({
            alias: file,
            src: `/assets/image/imagenobackgrd/${file}`
          })).concat(ITEM_FILES.map(file => ({
            alias: file,
            src: `/assets/image/items/${file}`
          })), [
            { alias: 'bg_game', src: '/assets/image/backgrounds/bg_game.webp' },
            { alias: 'bg_gameover', src: '/assets/image/backgrounds/bg_gameover.webp' }
          ])
        },
        {
          name: 'menu',
          assets: [
            { alias: 'bg_menu', src: '/assets/image/backgrounds/bg_menu.webp' }
          ]
        }
      ]
    };
    
    await Assets.init({ manifest });
    await Assets.loadBundle('menu', onProgress);
    
    // Initialize audio system and preload SFX buffers
    AudioManager.init();
    
    // Filter out the main character for the monsters pool
    this.monsterAvatars = AVATAR_FILES.filter(f => f !== MAIN_CHAR_FILE);
  }

  static async ensureGameplayAssets(onProgress) {
    if (!this.gameplayLoadPromise) {
      this.gameplayLoadPromise = Assets.loadBundle('gameplay', onProgress).catch((error) => {
        this.gameplayLoadPromise = null;
        throw error;
      });
    }
    return this.gameplayLoadPromise;
  }
  
  static getRandomMonsterTexture() {
    const randomFile = this.monsterAvatars[Math.floor(Math.random() * this.monsterAvatars.length)];
    return Assets.get(randomFile);
  }
  
  static getPlayerTexture() {
    return Assets.get(MAIN_CHAR_FILE);
  }

  static getRandomItemTexture() {
    const randomFile = ITEM_FILES[Math.floor(Math.random() * ITEM_FILES.length)];
    return Assets.get(randomFile);
  }
}
