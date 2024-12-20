import { Entity, EntityManager } from './Component';
import { PhysicsComponent } from './components/PhysicsComponent';
import { InputComponent } from './components/InputComponent';
import { MovementComponent } from './components/MovementComponent';

export class EntityFactory {
    static createPlayerShip(scene: Phaser.Scene, x: number, y: number): Entity {
        const entity = new Entity();
        
        // Create a triangular ship shape
        const graphics = scene.add.graphics();
        graphics.clear();
        
        // Outer glow effect
        graphics.lineStyle(3, 0x00FF00, 0.3);
        graphics.beginPath();
        graphics.moveTo(-15, -15);
        graphics.lineTo(25, 0);
        graphics.lineTo(-15, 15);
        graphics.lineTo(-10, 0);
        graphics.closePath();
        graphics.stroke();
        
        // Main ship shape
        graphics.lineStyle(2, 0x00FF00, 1);
        graphics.fillStyle(0x00FF00, 0.8);
        graphics.beginPath();
        graphics.moveTo(-12, -12);
        graphics.lineTo(20, 0);
        graphics.lineTo(-12, 12);
        graphics.lineTo(-8, 0);
        graphics.closePath();
        graphics.fill();
        graphics.stroke();
        
        // Convert to texture
        const key = 'ship_sprite';
        if (!scene.textures.exists(key)) {
            graphics.generateTexture(key, 40, 30);
        }
        graphics.destroy();
        
        // Create sprite with glow effect
        const sprite = scene.add.sprite(x, y, key);
        sprite.setDepth(10);
        
        // Create components with proper entity reference
        const physicsComponent = new PhysicsComponent(scene, sprite, entity);
        const inputComponent = new InputComponent(entity, scene);
        const movementComponent = new MovementComponent(entity, 400, 3);

        // Configure physics
        const body = physicsComponent.getBody();
        if (body) {
            body.setDamping(true);
            body.setDrag(0);  // We'll handle drag manually
            body.setAngularDrag(0);  // We'll handle rotation manually
            body.setMaxVelocity(500);
            body.setBounce(0);
            body.setFriction(0);
        }
        
        // Register components with their type names
        entity.addComponent('physics', physicsComponent);
        entity.addComponent('input', inputComponent);
        entity.addComponent('movement', movementComponent);
        
        EntityManager.getInstance().addEntity(entity);
        console.log('Created player ship with components:', entity);
        return entity;
    }

    static createRover(scene: Phaser.Scene, x: number, y: number): Entity {
        const entity = new Entity();
        
        // Create a rectangle for the rover
        const graphics = scene.add.graphics();
        graphics.lineStyle(2, 0x00ff00);
        graphics.fillStyle(0x00aa00);
        graphics.fillRect(-20, -20, 40, 40);
        graphics.strokeRect(-20, -20, 40, 40);
        
        // Convert graphics to sprite
        const key = 'rover_temp';
        if (!scene.textures.exists(key)) {
            graphics.generateTexture(key, 40, 40);
        }
        graphics.destroy();
        
        const sprite = scene.add.sprite(x, y, key);
        
        // Create components with proper entity reference
        const physicsComponent = new PhysicsComponent(scene, sprite, entity);
        const inputComponent = new InputComponent(entity, scene);
        const movementComponent = new MovementComponent(entity, 150, 200);

        // Register components with their type names
        entity.addComponent('physics', physicsComponent);
        entity.addComponent('input', inputComponent);
        entity.addComponent('movement', movementComponent);

        EntityManager.getInstance().addEntity(entity);
        return entity;
    }

    static createPlanet(scene: Phaser.Scene, x: number, y: number): Entity {
        const entity = new Entity();
        const sprite = scene.add.sprite(x, y, 'planet');
        sprite.setScale(1);

        // Create component with proper entity reference
        const physicsComponent = new PhysicsComponent(scene, sprite, entity);

        // Register component with its type name
        entity.addComponent('physics', physicsComponent);

        EntityManager.getInstance().addEntity(entity);
        return entity;
    }
}
