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
        const backdrop = new Graphics().rect(-2000, -2000, 4000, 4000).fill({ color: 0x000000, alpha: 0.5 });
        backdrop.eventMode = 'static';
        this.addChild(backdrop);

        this.modal = new Container();
        this.addChild(this.modal);
        
        // White Card with soft lavender shadow (no border)
        const cardFace = new Graphics()
          .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 28)
          .fill({ color: 0xFFFFFF });
        this.modal.addChild(cardFace);

        // Title Ribbon — Lavender gradient
        const ribbonW = 300;
        const ribbonH = 42;
        const ribbonY = -cardH / 2;
        const ribbonRadius = ribbonH / 2;
        
        const ribGrad = new FillGradient(0, ribbonY - ribbonH / 2, 0, ribbonY + ribbonH / 2);
        ribGrad.addColorStop(0, 0xB39DDB);
        ribGrad.addColorStop(1, 0x7E57C2);
        
        const ribbon = new Graphics()
          .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2 + 4, ribbonW, ribbonH, ribbonRadius)
          .fill({ color: 0x4A148C, alpha: 0.3 })
          .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2, ribbonW, ribbonH, ribbonRadius)
          .fill(ribGrad)
          .stroke({ color: 0xffffff, width: 3 });
        this.modal.addChild(ribbon);

        const titleText = new Text({
          text: "BẢNG VÀNG THÀNH TÍCH",
          style: new TextStyle({
            fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
            fontSize: 18,
            fill: 0xffffff,
            fontWeight: "700",
            letterSpacing: 1
          }),
        });
        titleText.anchor.set(0.5);
        titleText.position.set(0, ribbonY);
        this.modal.addChild(titleText);
        
        // Header Labels
        const headerStyle = new TextStyle({
            fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
            fontSize: 16,
            fill: 0x7E57C2,
            fontWeight: "700"
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
        let rowHeight = 44;
        
        const rowStyle = new TextStyle({
            fontFamily: "'Quicksand', 'Be Vietnam Pro', sans-serif",
            fontSize: 17,
            fill: 0x453268,
            fontWeight: "700"
        });
        
        mockData.forEach((data, index) => {
            let ry = startY + index * rowHeight;
            let bgColor = index % 2 === 0 ? 0xF3F3F4 : 0xFFFFFF;
            
            const rowBg = new Graphics()
                .roundRect(-215, ry - 18, 430, 36, 18)
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
            
            // Avatar placeholder — lavender circle
            const avatar = new Graphics().circle(-110, ry, 13).fill({ color: 0xD1C4E9 });
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
        
        // Personal Best Footer — Mint highlight
        const footerBg = new Graphics()
            .roundRect(-215, 150, 430, 44, 22)
            .fill({ color: 0x80CBC4, alpha: 0.2 })
            .stroke({ color: 0x80CBC4, width: 2 });
        this.modal.addChild(footerBg);
        
        const myScore = localStorage.getItem('swipeRpgMaxFloor') || 1;
        
        const myRank = new Text({ text: "99+", style: new TextStyle({ ...rowStyle, fill: 0x453268 }) });
        myRank.anchor.set(0.5);
        myRank.position.set(-160, 172);
        
        const myAvatar = new Graphics().circle(-110, 172, 13).fill({ color: 0x80CBC4 });
        this.modal.addChild(myAvatar);
        
        const myName = new Text({ text: "Bạn (Khách)", style: new TextStyle({ ...rowStyle, fill: 0x453268 }) });
        myName.anchor.set(0, 0.5);
        myName.position.set(-80, 172);
        
        const myScoreText = new Text({ text: `${myScore}`, style: new TextStyle({ ...rowStyle, fill: 0x453268 }) });
        myScoreText.anchor.set(1, 0.5);
        myScoreText.position.set(155, 172);
        
        this.modal.addChild(myRank, myName, myScoreText);
        
        // Close Button — Lavender
        const backSvg = `<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`;
        const backBtn = new IconBtn(backSvg, () => {
            if (this.onClose) this.onClose();
        }, 28, '#B39DDB', '#9575CD', '#7E57C2');
        backBtn.position.set(0, 230);
        this.modal.addChild(backBtn);
    }
    
    resize(width, height) {
        this.modal.position.set(width / 2, height / 2);
        const scale = Math.min(1.0, (width - 40) / 480);
        this.modal.scale.set(scale);
    }
}
