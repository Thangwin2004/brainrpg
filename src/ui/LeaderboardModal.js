import { Container, Graphics, FillGradient, Text, TextStyle, BlurFilter } from 'pixi.js';
import { IconBtn } from './Button.js';
import { winkGame } from '../integrations/wink/wink-adapter.js';
import { i18n, t } from '../system/I18nManager.js';

function getEffectiveUser() {
  if (winkGame && winkGame.personalBest?.displayName) {
    return {
      name: winkGame.personalBest.displayName,
    };
  }

  try {
    const savedUser = localStorage.getItem("google_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed && parsed.name) return parsed;
    }
  } catch (e) {}

  if (winkGame && winkGame.isAuthenticated) {
    return {
      name: t("leaderboard.defaultMember"),
    };
  }
  return null;
}

export class LeaderboardModal extends Container {
    constructor(onClose) {
        super();
        this.onClose = onClose;
        this.initUI();
        this._unsubI18n = i18n.subscribe(() => this.applyLanguage());
        
        // Blur siblings when added to simulate backdrop-filter
        this.on('added', () => {
            if (this.parent) {
                this.siblingFilters = new Map();
                this.parent.children.forEach(child => {
                    if (child !== this && !child.isBackdrop) {
                        const filter = new BlurFilter({ strength: 5, quality: 3 });
                        child.filters = child.filters ? [...child.filters, filter] : [filter];
                        this.siblingFilters.set(child, filter);
                    }
                });
            }
        });

        this.on('removed', () => {
            if (this.siblingFilters) {
                for (const [child, filter] of this.siblingFilters.entries()) {
                    if (child.filters) {
                        child.filters = child.filters.filter(f => f !== filter);
                        if (child.filters.length === 0) child.filters = null;
                    }
                    filter.destroy();
                }
                this.siblingFilters.clear();
                this.siblingFilters = null;
            }
            if (this._unsubI18n) {
                this._unsubI18n();
                this._unsubI18n = null;
            }
        });
    }
    
    initUI() {
        const cardW = 480;
        const cardH = 560;

        // Overlay Backdrop
        const backdrop = new Graphics().rect(-2000, -2000, 4000, 4000).fill({ color: 0x000000, alpha: 0.65 });
        backdrop.eventMode = 'static';
        this.addChild(backdrop);

        this.modal = new Container();
        this.addChild(this.modal);
        
        // 1. Soft Card Shadow
        const cardShadow = new Graphics()
          .roundRect(-cardW / 2 + 6, -cardH / 2 + 12, cardW, cardH, 20)
          .fill({ color: 0x000000, alpha: 0.25 });
        this.modal.addChild(cardShadow);

        // 2. Thick 3D Soft Purple Border
        const borderGrad = new FillGradient(0, -cardH / 2, 0, cardH / 2);
        borderGrad.addColorStop(0, 0xD1C4E9);
        borderGrad.addColorStop(1, 0xB39DDB);

        const borderBg = new Graphics()
          .roundRect(-cardW / 2, -cardH / 2 + 6, cardW, cardH, 20)
          .fill({ color: 0x9575CD }) // Shadow Base
          .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 20)
          .fill(borderGrad);
        this.modal.addChild(borderBg);

        // 3. Bright Cream Card Face
        const cardFace = new Graphics()
          .roundRect(-cardW / 2 + 12, -cardH / 2 + 12, cardW - 24, cardH - 24, 14)
          .fill({ color: 0xfbfaf5 });
        this.modal.addChild(cardFace);

        // 4. Floating 3D Title Ribbon (Purple)
        const ribbonW = 230;
        const ribbonH = 42;
        const ribbonY = -cardH / 2;
        const ribbonRadius = ribbonH / 2;
        
        const ribbonGrad = new FillGradient(0, ribbonY - ribbonH / 2, 0, ribbonY + ribbonH / 2);
        ribbonGrad.addColorStop(0, 0x9575CD);
        ribbonGrad.addColorStop(1, 0x7E57C2);

        const ribbon = new Graphics()
          .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2 + 5, ribbonW, ribbonH, ribbonRadius)
          .fill({ color: 0x512DA8 }) // Ribbon shadow
          .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2, ribbonW, ribbonH, ribbonRadius)
          .fill(ribbonGrad)
          .stroke({ color: 0xffffff, width: 3.5 })
          .ellipse(0, ribbonY - ribbonH / 4, ribbonW * 0.42, ribbonH * 0.2)
          .fill({ color: 0xffffff, alpha: 0.25 });
        this.modal.addChild(ribbon);

        this.titleText = new Text({
          text: t("leaderboard.title"),
          style: new TextStyle({
            fontFamily: ['Be Vietnam Pro', 'sans-serif'],
            fontSize: 20,
            fill: 0xffffff,
            fontWeight: "900",
            letterSpacing: 1.2
          }),
        });
        this.titleText.anchor.set(0.5);
        this.titleText.position.set(0, ribbonY);
        this.modal.addChild(this.titleText);
        
        // Header Labels
        const headerStyle = new TextStyle({
            fontFamily: ['Be Vietnam Pro', 'sans-serif'],
            fontSize: 16,
            fill: 0x7E57C2, // Purple
            fontWeight: "900"
        });
        
        this.lblRank = new Text({ text: t("leaderboard.rankHeader"), style: headerStyle });
        this.lblRank.anchor.set(0.5);
        this.lblRank.position.set(-160, -155);
        
        this.lblName = new Text({ text: t("leaderboard.playerHeader"), style: headerStyle });
        this.lblName.anchor.set(0, 0.5);
        this.lblName.position.set(-80, -155);
        
        this.lblScore = new Text({ text: t("leaderboard.floorHeader"), style: headerStyle });
        this.lblScore.anchor.set(1, 0.5);
        this.lblScore.position.set(155, -155);
        
        this.modal.addChild(this.lblRank, this.lblName, this.lblScore);

        this.rowsContainer = new Container();
        this.modal.addChild(this.rowsContainer);

        const startY = -115;
        const rowHeight = 46;
        
        const rowStyle = new TextStyle({
            fontFamily: ['Be Vietnam Pro', 'sans-serif'],
            fontSize: 18,
            fill: 0x4A148C, // Deep Purple
            fontWeight: "bold"
        });

        const renderRows = (entries) => {
            this.currentEntries = entries || [];
            this.rowsContainer.removeChildren();
            if (!entries || entries.length === 0) {
                const emptyText = new Text({
                    text: t("leaderboard.empty").replace(/<br\/>/g, "\n"),
                    style: new TextStyle({
                        fontFamily: ['Be Vietnam Pro', 'sans-serif'],
                        fontSize: 15,
                        fill: 0x7E57C2,
                        fontWeight: "bold",
                        align: 'center',
                        wordWrap: true,
                        wordWrapWidth: 360
                    })
                });
                emptyText.anchor.set(0.5);
                emptyText.position.set(0, -20);
                this.rowsContainer.addChild(emptyText);
                return;
            }

            const limit = Math.min(5, entries.length);
            for (let index = 0; index < limit; index++) {
                const data = entries[index];
                let ry = startY + index * rowHeight;
                let bgColor = index % 2 === 0 ? 0xF4F0F9 : 0xFFFFFF; // Alternating soft purple/white
                
                const rowBg = new Graphics()
                    .roundRect(-215, ry - 20, 430, 40, 20)
                    .fill({ color: bgColor });
                this.rowsContainer.addChild(rowBg);
                
                // Rank Medal
                let rankNum = data.rank || (index + 1);
                let rankStr = `${rankNum}`;
                if (rankNum === 1) rankStr = "🥇";
                if (rankNum === 2) rankStr = "🥈";
                if (rankNum === 3) rankStr = "🥉";
                
                const rankText = new Text({ text: rankStr, style: new TextStyle({ ...rowStyle, fontSize: 20 }) });
                rankText.anchor.set(0.5);
                rankText.position.set(-160, ry);
                this.rowsContainer.addChild(rankText);
                
                // Avatar placeholder — Soft Purple circle
                const avatar = new Graphics().circle(-110, ry, 14).fill({ color: 0xB39DDB }).stroke({ color: 0xFFFFFF, width: 2 });
                this.rowsContainer.addChild(avatar);
                
                const nameText = new Text({ text: data.name, style: rowStyle });
                nameText.anchor.set(0, 0.5);
                nameText.position.set(-80, ry);
                this.rowsContainer.addChild(nameText);
                
                const scoreText = new Text({ text: `${data.score}`, style: rowStyle });
                scoreText.anchor.set(1, 0.5);
                scoreText.position.set(155, ry);
                this.rowsContainer.addChild(scoreText);
            }
        };

        // Personal Best Footer — Warm Gold highlight
        const footerBg = new Graphics()
            .roundRect(-215, 140, 430, 50, 25)
            .fill({ color: 0xFFF8E1 })
            .stroke({ color: 0xFFD54F, width: 3 });
        this.modal.addChild(footerBg);
        
        const myScoreLocal = parseInt(localStorage.getItem('swipeRpgMaxFloor')) || 0;
        
        this.myRank = new Text({ text: myScoreLocal > 0 ? "1" : "—", style: new TextStyle({ ...rowStyle, fill: 0xFF8F00 }) });
        this.myRank.anchor.set(0.5);
        this.myRank.position.set(-160, 165);
        
        const myAvatar = new Graphics().circle(-110, 165, 14).fill({ color: 0xFFCA28 }).stroke({ color: 0xFFFFFF, width: 2 });
        this.modal.addChild(myAvatar);
        
        const effUser = getEffectiveUser();
        const playerName = effUser ? effUser.name : (winkGame?.isAuthenticated ? t("menu.member") : t("leaderboard.youGuest"));
        this.myName = new Text({ text: playerName, style: new TextStyle({ ...rowStyle, fill: 0xFF8F00 }) });
        this.myName.anchor.set(0, 0.5);
        this.myName.position.set(-80, 165);
        
        this.myScoreText = new Text({ text: `${myScoreLocal}`, style: new TextStyle({ ...rowStyle, fill: 0xFF8F00 }) });
        this.myScoreText.anchor.set(1, 0.5);
        this.myScoreText.position.set(155, 165);
        
        this.modal.addChild(this.myRank, this.myName, this.myScoreText);

        const updateFooter = (pb) => {
            const activeUser = getEffectiveUser();
            const pName = pb?.displayName || (activeUser ? activeUser.name : (winkGame?.isAuthenticated ? t("leaderboard.defaultMember") : t("leaderboard.youGuest")));
            const pScore = pb?.score !== undefined && pb?.score !== null ? pb.score : myScoreLocal;
            const rankNum = pb?.rank || (pScore > 0 ? 1 : 0);
            const rankStr = rankNum > 0 ? (rankNum === 1 ? "🥇" : rankNum === 2 ? "🥈" : rankNum === 3 ? "🥉" : `#${rankNum}`) : "—";

            this.myRank.text = rankStr;
            this.myName.text = pName;
            this.myScoreText.text = `${pScore}`;
        };
        this.renderRows = renderRows;
        this.updateFooter = updateFooter;

        const defaultEntries = myScoreLocal > 0 ? [{ name: playerName, score: myScoreLocal, rank: 1 }] : [];
        renderRows(defaultEntries);
        updateFooter(winkGame?.personalBest);

        if (winkGame) {
            Promise.all([
                winkGame.refreshLeaderboard({ limit: 10 }),
                winkGame.getPersonalBest()
            ]).then(([lbRes, pbRes]) => {
                if (lbRes && Array.isArray(lbRes.entries) && lbRes.entries.length > 0) {
                    const apiEntries = lbRes.entries.map((item, idx) => ({
                        name: item.displayName || item.name || t("leaderboard.defaultMemberNumber", { rank: item.rank || idx + 1 }),
                        score: item.score || 0,
                        rank: item.rank || idx + 1,
                    }));
                    renderRows(apiEntries);
                }
                const activePb = pbRes?.me || lbRes?.me || winkGame.personalBest;
                updateFooter(activePb);
            }).catch(() => {});
        }
        
        // Close Button
        const closeSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
        this.closeBtn = new IconBtn(closeSvg, () => {
            if (this.onClose) this.onClose();
        }, 22, '#D1C4E9', '#B39DDB', '#9575CD'); // Soft Purple
        
        // Position at top-right, just like SettingsModal
        this.closeBtn.position.set(cardW / 2 - 20, -cardH / 2 + 20);
        this.modal.addChild(this.closeBtn);
    }

    applyLanguage() {
        if (this.titleText && !this.titleText.destroyed) {
            this.titleText.text = t("leaderboard.title");
        }
        if (this.lblRank && !this.lblRank.destroyed) {
            this.lblRank.text = t("leaderboard.rankHeader");
        }
        if (this.lblName && !this.lblName.destroyed) {
            this.lblName.text = t("leaderboard.playerHeader");
        }
        if (this.lblScore && !this.lblScore.destroyed) {
            this.lblScore.text = t("leaderboard.floorHeader");
        }
        if (this.renderRows) this.renderRows(this.currentEntries || []);
        if (this.updateFooter) this.updateFooter(winkGame?.personalBest);
    }
    
    resize(width, height) {
        this.modal.position.set(width / 2, height / 2);
        const scale = Math.min(1.0, (width - 40) / 480);
        this.modal.scale.set(scale);
    }
}
