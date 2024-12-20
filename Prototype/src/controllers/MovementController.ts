import 'phaser';

export enum MovementMode {
    SPACE,
    SURFACE
}

export class MovementController {
    private scene: Phaser.Scene;
    private sprite: Phaser.Physics.Arcade.Sprite;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private mode: MovementMode;

    // Movement parameters
    private spaceAcceleration = 200;
    private spaceDrag = 0.99;
    private maxSpaceSpeed = 400;
    private surfaceSpeed = 200;
    private surfaceJumpSpeed = -400;

    constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite, mode: MovementMode) {
        this.scene = scene;
        this.sprite = sprite;
        this.mode = mode;
        this.cursors = scene.input.keyboard.createCursorKeys();
    }

    update() {
        if (this.mode === MovementMode.SPACE) {
            this.updateSpaceMovement();
        } else {
            this.updateSurfaceMovement();
        }
    }

    private updateSpaceMovement() {
        // Apply acceleration based on input
        if (this.cursors.left.isDown) {
            this.sprite.setAccelerationX(-this.spaceAcceleration);
        } else if (this.cursors.right.isDown) {
            this.sprite.setAccelerationX(this.spaceAcceleration);
        } else {
            this.sprite.setAccelerationX(0);
        }

        if (this.cursors.up.isDown) {
            this.sprite.setAccelerationY(-this.spaceAcceleration);
        } else if (this.cursors.down.isDown) {
            this.sprite.setAccelerationY(this.spaceAcceleration);
        } else {
            this.sprite.setAccelerationY(0);
        }

        // Apply drag
        this.sprite.setVelocity(
            this.sprite.body.velocity.x * this.spaceDrag,
            this.sprite.body.velocity.y * this.spaceDrag
        );

        // Limit maximum speed
        const speed = Math.sqrt(
            Math.pow(this.sprite.body.velocity.x, 2) + 
            Math.pow(this.sprite.body.velocity.y, 2)
        );

        if (speed > this.maxSpaceSpeed) {
            const ratio = this.maxSpaceSpeed / speed;
            this.sprite.setVelocity(
                this.sprite.body.velocity.x * ratio,
                this.sprite.body.velocity.y * ratio
            );
        }
    }

    private updateSurfaceMovement() {
        // Horizontal movement
        if (this.cursors.left.isDown) {
            this.sprite.setVelocityX(-this.surfaceSpeed);
        } else if (this.cursors.right.isDown) {
            this.sprite.setVelocityX(this.surfaceSpeed);
        } else {
            this.sprite.setVelocityX(0);
        }

        // Jumping
        if (this.cursors.up.isDown && this.sprite.body.touching.down) {
            this.sprite.setVelocityY(this.surfaceJumpSpeed);
        }
    }

    setMode(mode: MovementMode) {
        this.mode = mode;
        // Reset physics when changing modes
        this.sprite.setVelocity(0, 0);
        this.sprite.setAcceleration(0, 0);
    }
}
    setMode(mode: MovementMode) {
        this.mode = mode;
        // Reset physics when changing modes
        this.sprite.setVelocity(0, 0);
        this.sprite.setAcceleration(0, 0);
    }
}
