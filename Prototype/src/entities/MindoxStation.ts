import 'phaser';
import { ParentableEntity, Parentable } from './ParentableEntity';
import { CelestialBody } from '../procedural/CelestialBody';

export class MindoxStation extends Phaser.GameObjects.Sprite implements Parentable {
    private parentable: ParentableEntity;
    private orbitAngle: number = 0;
    private orbitSpeed: number;
    private orbitDistance: number;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        orbitDistance: number,
        initialAngle: number,
        orbitSpeed: number
    ) {
        super(scene, x, y, 'mindox_station_0001');
        scene.add.existing(this);
        
        this.parentable = new ParentableEntity(this);
        this.orbitAngle = initialAngle;
        this.orbitSpeed = orbitSpeed;
        this.orbitDistance = orbitDistance;
        
        // Set depth to appear above planets but below UI
        this.setDepth(15);
        
        // Start the blinking animation
        this.play('mindox_station_blink');
    }

    static createAnimation(scene: Phaser.Scene) {
        if (!scene.anims.exists('mindox_station_blink')) {
            scene.anims.create({
                key: 'mindox_station_blink',
                frames: [
                    { key: 'mindox_station_0001', duration: 2000 },
                    { key: 'mindox_station_0002', duration: 500 }
                ],
                repeat: -1
            });
        }
    }

    public update(time: number, delta: number) {
        if (this.parentable.isParented()) {
            const parent = this.parentable.getParent() as CelestialBody;
            
            // Update orbit angle
            this.orbitAngle += this.orbitSpeed * delta * 0.001; // Convert delta to seconds
            
            // Calculate new position
            const newX = parent.getX() + Math.cos(this.orbitAngle) * this.orbitDistance;
            const newY = parent.getY() + Math.sin(this.orbitAngle) * this.orbitDistance;
            
            // Update position
            this.setPosition(newX, newY);
            
            // Update rotation to face orbit direction
            this.setRotation(this.orbitAngle + Math.PI/2);
        }
    }

    // Implement Parentable interface
    public setPosition(x: number, y: number): this {
        super.setPosition(x, y);
        return this;
    }

    public getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }

    public getParentable(): ParentableEntity {
        return this.parentable;
    }

    public constrainTo(parent: Parentable): void {
        this.parentable.constrainTo(parent);
    }

    public unconstrain(): void {
        this.parentable.unconstrain();
    }

    public isParented(): boolean {
        return this.parentable.isParented();
    }
}
