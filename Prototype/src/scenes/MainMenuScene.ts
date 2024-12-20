import 'phaser';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        // Set background to pure black
        this.cameras.main.setBackgroundColor('#000000');

        // Add title with thin, spaced font
        const title = this.add.text(this.scale.width / 2, 200, 'P R O T O S T A R', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff',
            letterSpacing: 10,
            fontWeight: '100'
        });
        title.setOrigin(0.5);

        // Create an elegant BEGIN button
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = this.scale.width / 2;
        const buttonY = this.scale.height / 2 + 50;

        // Button container
        const buttonContainer = this.add.container(buttonX, buttonY);

        // Button background (thin border instead of solid background)
        const buttonBorder = this.add.graphics();
        buttonBorder.lineStyle(1, 0xffffff, 1);
        buttonBorder.strokeRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight);
        buttonContainer.add(buttonBorder);

        // Button text
        const buttonText = this.add.text(0, 0, 'BEGIN', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            letterSpacing: 4,
            fontWeight: '100'
        });
        buttonText.setOrigin(0.5);
        buttonContainer.add(buttonText);

        // Make button interactive
        const hitArea = new Phaser.Geom.Rectangle(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight);
        buttonContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        // Add hover effects
        buttonContainer.on('pointerover', () => {
            buttonBorder.clear();
            buttonBorder.lineStyle(1, 0xffffff, 1);
            buttonBorder.strokeRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight);
            buttonBorder.fillStyle(0xffffff, 0.1);
            buttonBorder.fillRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight);
            buttonText.setColor('#ffffff');
        });

        buttonContainer.on('pointerout', () => {
            buttonBorder.clear();
            buttonBorder.lineStyle(1, 0xffffff, 1);
            buttonBorder.strokeRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight);
            buttonText.setColor('#ffffff');
        });

        // Add click handler
        buttonContainer.on('pointerdown', () => {
            this.scene.start('ProceduralTestScene');
        });
    }
}
