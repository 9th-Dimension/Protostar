import { Component, Entity } from '../Component';

export class PhysicsComponent extends Component {
    private sprite: Phaser.GameObjects.Sprite;
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, entity: Entity) {
        super(entity);  // Pass the entity to the base class
        this.scene = scene;
        this.sprite = sprite;
        this.scene.physics.world.enable(this.sprite);
        
        // Debug: Log physics creation
        console.log('Physics enabled on sprite:', 
            this.sprite.x, this.sprite.y,
            this.sprite.visible,
            this.sprite.active
        );
    }

    getSprite(): Phaser.GameObjects.Sprite {
        return this.sprite;
    }

    getBody(): Phaser.Physics.Arcade.Body | null {
        if (this.sprite.body instanceof Phaser.Physics.Arcade.Body) {
            return this.sprite.body;
        }
        console.error('No physics body found on sprite!');
        return null;
    }

    setVelocity(x: number, y: number): void {
        const body = this.getBody();
        if (body) {
            body.setVelocity(x, y);
        }
    }

    setAcceleration(x: number, y: number): void {
        const body = this.getBody();
        if (body) {
            body.setAcceleration(x, y);
        }
    }

    update(delta: number): void {
        // Add any physics-related updates here
        const body = this.getBody();
        if (body) {
            // Log position for debugging
            console.log('Physics update - Position:', body.x, body.y, 'Velocity:', body.velocity.x, body.velocity.y);
        }
    }
}
