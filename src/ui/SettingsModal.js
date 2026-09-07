import { Container } from 'pixi.js';
import { AudioManager } from '../managers/AudioManager.js';
import { i18n, t } from '../system/I18nManager.js';

export class SettingsModal extends Container {
  constructor(onClose, onRestart, onHome) {
    super();
    this.onClose = onClose;
    this.onRestart = onRestart;
    this.onHome = onHome;
    this.overlay = null;

    this.showHTMLModal();

    this.on('removed', () => {
      this.cleanup();
    });
  }

  showHTMLModal() {
    // Clean up any stale overlay
    const stale = document.getElementById('game-settings-overlay-id');
    if (stale) stale.remove();

    const overlay = document.createElement('div');
    overlay.id = 'game-settings-overlay-id';
    overlay.className = 'game-popup-overlay';
    this.overlay = overlay;

    const card = document.createElement('div');
    card.className = 'game-popup-card';

    const title = document.createElement('div');
    title.className = 'game-popup-title';
    title.innerText = t('settings.title');
    card.appendChild(title);

    const closeModal = () => {
      AudioManager.playClickSFX();
      overlay.style.opacity = '0';
      card.style.transform = 'scale(0.85)';
      setTimeout(() => {
        if (overlay.parentNode) overlay.remove();
        this.overlay = null;
        if (this.onClose) this.onClose();
      }, 250);
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'game-popup-close-btn';
    closeBtn.setAttribute('aria-label', t('actions.cancel'));
    closeBtn.addEventListener('click', closeModal);
    card.appendChild(closeBtn);

    const rowContainer = document.createElement('div');
    rowContainer.className = 'game-settings-row-container';

    const createToggleRow = (label, isEnabled, onToggle) => {
      const row = document.createElement('div');
      row.style.cssText =
        'width:100%; height:64px; border-radius:12px; background:#ffffff; border:2.5px solid #d1c4e9; display:flex; justify-content:space-between; align-items:center; padding:0 16px; box-sizing:border-box; margin-bottom:12px;';

      const text = document.createElement('span');
      text.style.cssText =
        "font-family:'Be Vietnam Pro', sans-serif; font-size:17px; font-weight:bold; color:#4a148c; letter-spacing:0.8px; white-space:nowrap;";
      text.innerText = label;

      const toggle = document.createElement('div');
      const isMuted = !isEnabled;
      toggle.style.cssText = `width:86px; height:42px; border-radius:21px; background:${isMuted ? '#e8e3d8' : 'linear-gradient(180deg,#7eea94,#25b957)'}; border:3px solid #fff; box-shadow: inset 0 2px 0 rgba(255,255,255,.4), 0 4px 0 ${isMuted ? '#7d7972' : '#14873b'}, 0 6px 10px rgba(0,0,0,0.15); cursor:pointer; position:relative; transition: background 0.25s, transform 0.1s; flex-shrink:0; display:flex; align-items:center;`;

      const statusText = document.createElement('span');
      statusText.innerText = isMuted ? 'OFF' : 'ON';
      statusText.style.cssText = `color:#fff; font-family:'Be Vietnam Pro', sans-serif; font-size:16px; position:absolute; width:100%; text-align:center; padding-right:${isMuted ? '0' : '28px'}; padding-left:${isMuted ? '28px' : '0'}; box-sizing:border-box; transition: padding 0.25s; text-shadow: 0 2px 3px rgba(0,0,0,0.4); pointer-events:none;`;

      const knob = document.createElement('div');
      knob.style.cssText = `width:32px; height:32px; border-radius:50%; background:#fff; position:absolute; top:2px; left:${isMuted ? '3px' : '45px'}; transition: left 0.25s cubic-bezier(0.3, 1.2, 0.5, 1); box-shadow: 0 3px 6px rgba(0,0,0,0.4); pointer-events:none;`;

      toggle.appendChild(statusText);
      toggle.appendChild(knob);

      toggle.onclick = () => {
        AudioManager.playClickSFX();
        const newState = onToggle();
        const nowMuted = !newState;
        toggle.style.background = nowMuted
          ? '#e8e3d8'
          : 'linear-gradient(180deg,#7eea94,#25b957)';
        toggle.style.boxShadow = `inset 0 2px 0 rgba(255,255,255,.4), 0 4px 0 ${nowMuted ? '#7d7972' : '#14873b'}, 0 6px 10px rgba(0,0,0,0.15)`;
        knob.style.left = nowMuted ? '3px' : '45px';
        statusText.innerText = nowMuted ? 'OFF' : 'ON';
        statusText.style.paddingRight = nowMuted ? '0' : '28px';
        statusText.style.paddingLeft = nowMuted ? '28px' : '0';
      };

      toggle.onmousedown = () => (toggle.style.transform = 'scale(0.92)');
      toggle.onmouseup = () => (toggle.style.transform = 'scale(1)');
      toggle.onmouseleave = () => (toggle.style.transform = 'scale(1)');

      row.appendChild(text);
      row.appendChild(toggle);
      row.labelElement = text;
      return row;
    };

    // Music row
    const musicRow = createToggleRow(
      '🎵 ' + t('settings.music'),
      !AudioManager.isBgmMuted,
      () => {
        AudioManager.toggleBGM();
        return !AudioManager.isBgmMuted;
      }
    );
    rowContainer.appendChild(musicRow);

    // SFX row
    const sfxRow = createToggleRow(
      '🔊 ' + t('settings.sfx'),
      !AudioManager.isSfxMuted,
      () => {
        AudioManager.toggleSFX();
        return !AudioManager.isSfxMuted;
      }
    );
    rowContainer.appendChild(sfxRow);

    let homeBtn = null;
    let restartBtn = null;

    // Only display language selection in main menu settings, not in-game pause modal
    const isIngame = Boolean(this.onRestart || this.onHome);
    if (!isIngame) {
      const createLanguageRow = () => {
        const row = document.createElement('div');
        row.className = 'game-settings-language-row';

        const label = document.createElement('span');
        label.className = 'game-settings-label';
        label.innerText = '🌐 ' + t('settings.language');

        const select = document.createElement('select');
        select.className = 'game-settings-language-select';
        select.setAttribute('aria-label', t('settings.language'));
        select.innerHTML = `
          <option value="en">${t('settings.english')}</option>
          <option value="vi">${t('settings.vietnamese')}</option>
        `;
        select.value = i18n.language;

        select.addEventListener('change', () => {
          AudioManager.playClickSFX();
          i18n.setLanguage(select.value);
          title.innerText = t('settings.title');
          musicRow.labelElement.innerText = '🎵 ' + t('settings.music');
          sfxRow.labelElement.innerText = '🔊 ' + t('settings.sfx');
          label.innerText = '🌐 ' + t('settings.language');
          select.setAttribute('aria-label', t('settings.language'));
          select.innerHTML = `
            <option value="en">${t('settings.english')}</option>
            <option value="vi">${t('settings.vietnamese')}</option>
          `;
          select.value = i18n.language;
          if (versionText) versionText.innerText = t('settings.version');
          if (closeBtn) closeBtn.setAttribute('aria-label', t('actions.cancel'));
          if (restartBtn) restartBtn.setAttribute('aria-label', t('actions.replay'));
          if (homeBtn) homeBtn.setAttribute('aria-label', t('actions.home'));
        });

        row.append(label, select);
        return row;
      };
      rowContainer.appendChild(createLanguageRow());
    }

    card.appendChild(rowContainer);

    // Extra action buttons (Home, Replay) if provided
    if (this.onRestart || this.onHome) {
      const actionContainer = document.createElement('div');
      actionContainer.className = 'game-paused-action-container';

      if (this.onHome) {
        homeBtn = document.createElement('button');
        homeBtn.className = 'game-paused-btn game-paused-btn--home';
        homeBtn.setAttribute('aria-label', t('actions.home'));
        homeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" fill="#FFFFFF"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
        homeBtn.addEventListener('click', () => {
          AudioManager.playClickSFX();
          overlay.remove();
          this.overlay = null;
          if (this.onHome) this.onHome();
        });
        actionContainer.appendChild(homeBtn);
      }

      if (this.onRestart) {
        restartBtn = document.createElement('button');
        restartBtn.className = 'game-paused-btn game-paused-btn--replay';
        restartBtn.setAttribute('aria-label', t('actions.replay'));
        restartBtn.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" fill="#FFFFFF"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
        restartBtn.addEventListener('click', () => {
          AudioManager.playClickSFX();
          overlay.remove();
          this.overlay = null;
          if (this.onRestart) this.onRestart();
        });
        actionContainer.appendChild(restartBtn);
      }

      card.appendChild(actionContainer);
    }

    const versionText = document.createElement('div');
    versionText.className = 'game-settings-version';
    versionText.innerText = t('settings.version');
    card.appendChild(versionText);

    overlay.appendChild(card);
    const appContainer = document.getElementById('app') || document.body;
    appContainer.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      card.style.opacity = '1';
      card.style.transform = 'scale(1)';
    });
  }

  resize() {
    // HTML modal is fixed and auto-centered via flexbox and dvw/dvh
  }

  cleanup() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.remove();
    }
    this.overlay = null;
  }
}
