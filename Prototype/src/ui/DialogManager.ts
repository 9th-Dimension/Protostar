import 'phaser';

interface DialogButton {
    text: string;
    callback: () => void;
}

interface DialogOptions {
    avatar?: string;
    message: string;
    buttons: DialogButton[];
}

export class DialogManager {
    private dialogBox?: Phaser.GameObjects.Container;
    private isVisible: boolean = false;
    private currentButtons: Phaser.GameObjects.Container[] = [];
    private selectedButtonIndex: number = 0;

    constructor(private scene: Phaser.Scene) {
        // Add keyboard listeners for dialog navigation
        this.scene.input.keyboard.on('keydown-LEFT', () => {
            if (this.isVisible) {
                this.selectPreviousButton();
            }
        });

        this.scene.input.keyboard.on('keydown-RIGHT', () => {
            if (this.isVisible) {
                this.selectNextButton();
            }
        });

        this.scene.input.keyboard.on('keydown-ENTER', () => {
            if (this.isVisible) {
                this.activateSelectedButton();
            }
        });
    }

    private selectPreviousButton(): void {
        if (this.currentButtons.length === 0) return;
        this.selectedButtonIndex = (this.selectedButtonIndex - 1 + this.currentButtons.length) % this.currentButtons.length;
        this.updateButtonHighlights();
    }

    private selectNextButton(): void {
        if (this.currentButtons.length === 0) return;
        this.selectedButtonIndex = (this.selectedButtonIndex + 1) % this.currentButtons.length;
        this.updateButtonHighlights();
    }

    private activateSelectedButton(): void {
        if (this.currentButtons.length === 0) return;
        const button = this.currentButtons[this.selectedButtonIndex];
        if (button && (button as any).callback) {
            (button as any).callback();
        }
    }

    private updateButtonHighlights(): void {
        this.currentButtons.forEach((button, index) => {
            const buttonBg = button.list[0] as Phaser.GameObjects.Rectangle;
            buttonBg.setFillStyle(index === this.selectedButtonIndex ? 0x666666 : 0x444444);
        });
    }

    public show(options: DialogOptions): void {
        this.hide(); // Clear any existing dialog

        const gameWidth = this.scene.cameras.main.width;
        const gameHeight = this.scene.cameras.main.height;

        // Create container for dialog elements
        this.dialogBox = this.scene.add.container(0, 0);
        this.dialogBox.setDepth(1000);
        this.dialogBox.setScrollFactor(0);

        // Create semi-transparent background that covers the whole dialog area
        const background = this.scene.add.rectangle(
            gameWidth - 300,
            gameHeight - 150,
            580,
            200,
            0x000000,
            0.8
        );
        this.dialogBox.add(background);

        // Add avatar if provided (now on the right side)
        if (options.avatar) {
            const avatar = this.scene.add.image(
                gameWidth - 100,  // Moved to right side
                gameHeight - 150,
                options.avatar
            ).setScale(0.8);
            this.dialogBox.add(avatar);
        }

        // Add message text (adjusted position for right-side avatar)
        const messageText = this.scene.add.text(
            gameWidth - 520,
            gameHeight - 200,
            options.message,
            {
                fontSize: '18px',
                color: '#ffffff',
                wordWrap: { width: 400 }  // Adjusted width to account for avatar
            }
        );
        this.dialogBox.add(messageText);

        // Clear existing buttons
        this.currentButtons.forEach(button => button.destroy());
        this.currentButtons = [];
        this.selectedButtonIndex = 0;

        // Add buttons
        const buttonSpacing = 120;
        options.buttons.forEach((button, index) => {
            const buttonX = gameWidth - 300 + (index - options.buttons.length/2 + 0.5) * buttonSpacing;
            const buttonY = gameHeight - 80;

            // Create button container
            const buttonContainer = this.scene.add.container(buttonX, buttonY);
            
            // Create button background
            const buttonBg = this.scene.add.rectangle(0, 0, 100, 30, 0x444444);
            
            // Create button text
            const buttonText = this.scene.add.text(0, 0, button.text, {
                fontSize: '16px',
                color: '#ffffff'
            }).setOrigin(0.5);

            // Add background and text to container
            buttonContainer.add(buttonBg);
            buttonContainer.add(buttonText);

            // Store the callback
            (buttonContainer as any).callback = button.callback;

            // Make the button interactive
            buttonBg.setInteractive(new Phaser.Geom.Rectangle(-50, -15, 100, 30), Phaser.Geom.Rectangle.Contains)
                .on('pointerover', () => {
                    buttonBg.setFillStyle(0x666666);
                    this.scene.game.canvas.style.cursor = 'pointer';
                    this.selectedButtonIndex = index;
                    this.updateButtonHighlights();
                })
                .on('pointerout', () => {
                    buttonBg.setFillStyle(0x444444);
                    this.scene.game.canvas.style.cursor = 'default';
                })
                .on('pointerdown', () => {
                    buttonBg.setFillStyle(0x333333);
                })
                .on('pointerup', () => {
                    button.callback();
                    this.scene.game.canvas.style.cursor = 'default';
                });

            // Add button container to dialog
            this.dialogBox.add(buttonContainer);
            this.currentButtons.push(buttonContainer);
        });

        // Initialize button highlights
        this.updateButtonHighlights();

        this.isVisible = true;
    }

    public hide(): void {
        if (this.dialogBox) {
            this.dialogBox.destroy();
            this.dialogBox = undefined;
        }
        this.currentButtons.forEach(button => button.destroy());
        this.currentButtons = [];
        this.selectedButtonIndex = 0;
        this.isVisible = false;
        this.scene.game.canvas.style.cursor = 'default';
    }

    public isDialogVisible(): boolean {
        return this.isVisible;
    }
}
