import { Component, Entity } from '../Component';
import { InputComponent } from './InputComponent';
import { PhysicsComponent } from './PhysicsComponent';

export enum MovementMode {
    SPACE,
    SURFACE
}

export class MovementComponent extends Component {
    private speed: number;
    private rotationSpeed: number;

    constructor(entity: Entity, speed: number, rotationSpeed: number) {
        super(entity);
        this.speed = speed;
        this.rotationSpeed = rotationSpeed;
    }

    update(delta: number): void {
        const physics = this.entity?.getComponent<PhysicsComponent>('physics');
        const input = this.entity?.getComponent<InputComponent>('input');
        
        if (!physics || !input) {
            console.log('Missing components:', { physics: !!physics, input: !!input });
            return;
        }
        
        const sprite = physics.getSprite();
        const body = physics.getBody();
        if (!sprite || !body) {
            console.log('Missing sprite or body');
            return;
        }

        // Rotation (A/D or Left/Right)
        if (input.isKeyDown('left')) {
            body.setAngularVelocity(-this.rotationSpeed * 60);
        } else if (input.isKeyDown('right')) {
            body.setAngularVelocity(this.rotationSpeed * 60);
        } else {
            body.setAngularVelocity(0);
        }

        // Movement (W/S or Up/Down)
        if (input.isKeyDown('up')) {
            const rotation = sprite.rotation;
            const velocityX = Math.cos(rotation) * this.speed;
            const velocityY = Math.sin(rotation) * this.speed;
            body.setVelocity(velocityX, velocityY);
            console.log('Thrust forward:', { velocityX, velocityY, rotation });
        } else if (input.isKeyDown('down')) {
            const rotation = sprite.rotation;
            const velocityX = Math.cos(rotation) * -this.speed * 0.6;
            const velocityY = Math.sin(rotation) * -this.speed * 0.6;
            body.setVelocity(velocityX, velocityY);
            console.log('Thrust backward:', { velocityX, velocityY, rotation });
        } else {
            // Apply drag when not thrusting
            body.velocity.x *= 0.98;
            body.velocity.y *= 0.98;
        }
    }
}
