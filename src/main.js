import { Game } from './core/Game.js';

window.onload = async () => {
  // Force-load Google Fonts with Vietnamese text before PixiJS renders
  await Promise.allSettled([
    document.fonts.load("700 1em Quicksand", "Bộ Lạc Đậu Phộng"),
    document.fonts.load("700 1em 'Be Vietnam Pro'", "Bộ Lạc Đậu Phộng"),
  ]);
  await document.fonts.ready;

  const game = new Game();
  await game.init();
};
