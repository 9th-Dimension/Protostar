import 'phaser';

export class Proton extends Phaser.Physics.Arcade.Sprite {
    private readonly SPEED = 400; // Projectile speed

    constructor(scene: Phaser.Scene, x: number, y: number, rotation: number) {
        super(scene, x, y, 'proton_0001');
        
        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set depth to be above most objects but below UI
        this.setDepth(15);
        
        // Set the rotation and adjust the angle to match ship's forward direction
        this.setRotation(rotation);
        
        // Start the animation
        this.play('proton_animation');
        
        // Calculate spawn position offset from ship's center
        const spawnOffset = 40; // Distance from ship's center
        const offsetX = Math.cos(rotation) * spawnOffset;
        const offsetY = Math.sin(rotation) * spawnOffset;
        this.setPosition(x + offsetX, y + offsetY);
        
        // Set the velocity based on the rotation
        const velocity = this.scene.physics.velocityFromRotation(
            rotation,
            this.SPEED
        );
        this.setVelocity(velocity.x, velocity.y);

        // Destroy the projectile after 2 seconds
        scene.time.delayedCall(2000, () => {
            this.destroy();
        });
    }

    static createAnimation(scene: Phaser.Scene): void {
        scene.anims.create({
            key: 'proton_animation',
            frames: [
                { key: 'proton_0001' },
                { key: 'proton_0002' }
            ],
            frameRate: 10,
            repeat: -1 // Loop indefinitely
        });
    }
}
