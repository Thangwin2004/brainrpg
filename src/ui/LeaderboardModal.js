import { Container, Graphics, FillGradient, Text, TextStyle } from 'pixi.js';
import { IconBtn } from './Button.js';

export class LeaderboardModal extends Container {
    constructor(onClose) {
        super();
        this.onClose = onClose;
        this.initUI();
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
        const ribbonW = 240;
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

        const titleText = new Text({
          text: "BẢNG XẾP HẠNG",
          style: new TextStyle({
            fontFamily: ['Be Vietnam Pro', 'sans-serif'],
            fontSize: 22,
            fill: 0xffffff,
            fontWeight: "900",
            letterSpacing: 1
          }),
        });
        titleText.anchor.set(0.5);
        titleText.position.set(0, ribbonY);
        this.modal.addChild(titleText);
        
        // Header Labels
        const headerStyle = new TextStyle({
            fontFamily: ['Be Vietnam Pro', 'sans-serif'],
            fontSize: 16,
            fill: 0x7E57C2, // Purple
            fontWeight: "900"
        });
        
        const lblRank = new Text({ text: "HẠNG", style: headerStyle });
        lblRank.anchor.set(0.5);
        lblRank.position.set(-160, -155);
        
        const lblName = new Text({ text: "THÀNH VIÊN", style: headerStyle });
        lblName.anchor.set(0, 0.5);
        lblName.position.set(-80, -155);
        
        const lblScore = new Text({ text: "ĐIỂM", style: headerStyle });
        lblScore.anchor.set(1, 0.5);
        lblScore.position.set(155, -155);
        
        this.modal.addChild(lblRank, lblName, lblScore);
        
        // Rows
        const mockData = [
            { name: "Nguyễn Văn A", score: 99 },
            { name: "Trần Thị B", score: 85 },
            { name: "Lê Văn C", score: 70 },
            { name: "Vũ Thị D", score: 65 },
            { name: "Phạm Văn E", score: 50 }
        ];
        
        let startY = -115;
        let rowHeight = 46;
        
        const rowStyle = new TextStyle({
            fontFamily: ['Be Vietnam Pro', 'sans-serif'],
            fontSize: 18,
            fill: 0x4A148C, // Deep Purple
            fontWeight: "bold"
        });
        
        mockData.forEach((data, index) => {
            let ry = startY + index * rowHeight;
            let bgColor = index % 2 === 0 ? 0xF4F0F9 : 0xFFFFFF; // Alternating soft purple/white
            
            const rowBg = new Graphics()
                .roundRect(-215, ry - 20, 430, 40, 20)
                .fill({ color: bgColor });
            this.modal.addChild(rowBg);
            
            // Rank Medal
            let rankStr = `${index + 1}`;
            if (index === 0) rankStr = "🥇";
            if (index === 1) rankStr = "🥈";
            if (index === 2) rankStr = "🥉";
            
            const rankText = new Text({ text: rankStr, style: new TextStyle({ ...rowStyle, fontSize: 20 }) });
            rankText.anchor.set(0.5);
            rankText.position.set(-160, ry);
            this.modal.addChild(rankText);
            
            // Avatar placeholder — Soft Purple circle
            const avatar = new Graphics().circle(-110, ry, 14).fill({ color: 0xB39DDB }).stroke({ color: 0xFFFFFF, width: 2 });
            this.modal.addChild(avatar);
            
            const nameText = new Text({ text: data.name, style: rowStyle });
            nameText.anchor.set(0, 0.5);
            nameText.position.set(-80, ry);
            this.modal.addChild(nameText);
            
            const scoreText = new Text({ text: `${data.score}`, style: rowStyle });
            scoreText.anchor.set(1, 0.5);
            scoreText.position.set(155, ry);
            this.modal.addChild(scoreText);
        });
        
        // Personal Best Footer — Warm Gold highlight
        const footerBg = new Graphics()
            .roundRect(-215, 140, 430, 50, 25)
            .fill({ color: 0xFFF8E1 })
            .stroke({ color: 0xFFD54F, width: 3 });
        this.modal.addChild(footerBg);
        
        const myScore = localStorage.getItem('swipeRpgMaxFloor') || 1;
        
        const myRank = new Text({ text: "99+", style: new TextStyle({ ...rowStyle, fill: 0xFF8F00 }) });
        myRank.anchor.set(0.5);
        myRank.position.set(-160, 165);
        
        const myAvatar = new Graphics().circle(-110, 165, 14).fill({ color: 0xFFCA28 }).stroke({ color: 0xFFFFFF, width: 2 });
        this.modal.addChild(myAvatar);
        
        const myName = new Text({ text: "Bạn (Khách)", style: new TextStyle({ ...rowStyle, fill: 0xFF8F00 }) });
        myName.anchor.set(0, 0.5);
        myName.position.set(-80, 165);
        
        const myScoreText = new Text({ text: `${myScore}`, style: new TextStyle({ ...rowStyle, fill: 0xFF8F00 }) });
        myScoreText.anchor.set(1, 0.5);
        myScoreText.position.set(155, 165);
        
        this.modal.addChild(myRank, myName, myScoreText);
        
        // Close Button
        const closeSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
        this.closeBtn = new IconBtn(closeSvg, () => {
            if (this.onClose) this.onClose();
        }, 22, '#D1C4E9', '#B39DDB', '#9575CD'); // Soft Purple
        
        // Position at top-right, just like SettingsModal
        this.closeBtn.position.set(cardW / 2 - 20, -cardH / 2 + 20);
        this.modal.addChild(this.closeBtn);
    }
    
    resize(width, height) {
        this.modal.position.set(width / 2, height / 2);
        const scale = Math.min(1.0, (width - 40) / 480);
        this.modal.scale.set(scale);
    }
}
