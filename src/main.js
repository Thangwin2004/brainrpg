import './style.css';
import { Ticker } from 'pixi.js';
import { Game } from './core/Game.js';
import { AudioManager } from './managers/AudioManager.js';
import { winkGame } from './integrations/wink/wink-adapter.js';
import { waitForGameFonts } from './utils/fontLoader.js';
import { installFocusPause } from './utils/focusPause.js';
import { installInteractionGuard } from './utils/interactionGuard.js';
import { i18n } from './system/I18nManager.js';

installInteractionGuard();

window.onload = async () => {
  await waitForGameFonts([
    "400 1em 'Be Vietnam Pro'",
    "500 1em 'Be Vietnam Pro'",
    "600 1em 'Be Vietnam Pro'",
    "700 1em 'Be Vietnam Pro'",
    "800 1em 'Be Vietnam Pro'",
    "900 1em 'Be Vietnam Pro'",
    "700 1em 'Baloo 2'",
    "800 1em 'Baloo 2'",
  ]);

  const game = new Game();
  await game.init();

  const focusPause = installFocusPause({
    isRunning: () => Boolean(Ticker.shared.started),
    pause: () => Ticker.shared.stop(),
    resume: () => Ticker.shared.start(),
    pauseAudio: () => AudioManager.pauseForFocus(),
    resumeAudio: () => AudioManager.resumeFromFocus(),
  });

  winkGame.bindLifecycle({
    onPause: focusPause.pauseFromHost,
    onResume: focusPause.resumeFromHost,
    onMute: () => AudioManager.setParentMuted?.(true),
    onUnmute: () => AudioManager.setParentMuted?.(false),
  });

  winkGame.observe((state) => i18n.syncFromWink(state));
  i18n.syncFromWink(winkGame.state);
};
