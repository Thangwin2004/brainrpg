import { Assets } from 'pixi.js';
import { AudioManager } from './AudioManager.js';

export const AVATAR_FILES = [
  "001_avatar_laclac.png",
  "002_avatar_cat_lick1.png",
  "003_avatar_duck.png",
  "004_avatar_turtle.png",
  "005_avatar_long.png",
  "006_avatar_horse.png",
  "007_avatar_tiguawhite.png",
  "008_avatar_husky.png",
  "009_avatar_doremonk.png",
  "010_avatar_echxanh1.png",
  "011_avatar_nudaeng.png",
  "012_avatar_hubcat.png",
  "013_avatar_unicorn.png",
  "014_avatar_zongbadou.png",
  "015_avatar_dauLan.png",
  "016_avatar_banhtung.png",
  "017_avatar_tiguayel.png",
  "018_avatar_megachard.png",
  "019_avatar_gigaboy.png",
  "020_avatar_cloudball.png",
  "021_avatar_culama.png",
  "022_avatar_poolpanda.png",
  "023_avatar_trollvn.png",
  "024_avatar_heothy.png",
  "025_avatar_zolype.png",
  "026_avatar_crick.png",
  "027_avatar_penguine.png",
  "028_avatar_timao.png",
  "029_avatar_caocal.png",
  "030_avatar_cowboy.png",
  "031_avatar_ninjadog.png",
  "032_avatar_petrocat.png",
  "033_avatar_richmonkey.png",
  "034_avatar_hazagi.png",
  "035_avatar_dogoin.png",
  "036_avatar_watermelon.png",
  "037_avatar_timone.png",
  "038_avatar_ronaldo.png",
  "039_avatar_hustmouse.png",
  "040_avatar_hitbear.png",
  "041_avatar_echxanh2.png",
  "042_avatar_zolype2.png",
  "043_avatar_cat_lick2.png",
  "044_avatar_poolpanda2.png"
];

export const ITEM_FILES = [
  "reddrink.png",
  "banhmi.png",
  "BimBim_02.png",
  "BanhChungBanhTet (1).png",
  "Lycaphe.png"
];

export const MAIN_CHAR_FILE = "010_avatar_echxanh1.png";

export class AssetManager {
  static async init(onProgress) {
    const manifest = {
      bundles: [
        {
          name: 'avatars',
          assets: AVATAR_FILES.map(file => ({
            alias: file,
            src: `/assets/image/imagenobackgrd/${file}`
          }))
        },
        {
          name: 'items',
          assets: ITEM_FILES.map(file => ({
            alias: file,
            src: `/assets/image/items/${file}`
          }))
        }
      ]
    };
    
    await Assets.init({ manifest });
    await Assets.loadBundle(['avatars', 'items'], onProgress);
    
    // Initialize audio system and preload SFX buffers
    AudioManager.init();
    
    // We can filter out the main character for the monsters pool
    this.monsterAvatars = AVATAR_FILES.filter(f => f !== MAIN_CHAR_FILE);
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
