import { Game } from './core/Game.js';

window.onload = async () => {
  const game = new Game();
  await game.init();
};
