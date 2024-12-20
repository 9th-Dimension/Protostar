import 'phaser';
import { Entity } from '../ecs/Component';
import { EntityFactory } from '../ecs/EntityFactory';
import { EntityManager } from '../ecs/Component';
import { PhysicsComponent } from '../ecs/components/PhysicsComponent';
import { WorldSystem } from '../world/WorldSystem';
import { CameraSystem } from '../world/CameraSystem';

export class PlanetScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private cameraSystem!: CameraSystem;
    private entityManager: EntityManager;
    private worldSystem: WorldSystem;
    private transitioning: boolean = false;

    constructor() {
        super({ key: 'PlanetScene' });
        this.entityManager = EntityManager.getInstance();
        this.worldSystem = WorldSystem.getInstance();
    }

    preload(): void {
        // Load planet surface assets
        this.load.setBaseURL('assets');
        this.load.image('player', 'sprites/player_temp.png');
        this.load.image('planetTiles', 'tiles/planet_tiles_temp.png');
    }

    create(): void {
        // Initialize camera system
        this.cameraSystem = new CameraSystem(this);
        this.cameraSystem.fadeIn(); // Fade in when entering planet

        // Create solid orange background for the planet surface
        this.cameras.main.setBackgroundColor('#FFA500');

        // Get current planet data
        const planet = this.worldSystem.getCurrentPlanet();
        if (!planet || !planet.tilemap) {
            console.error('No planet data available');
            return;
        }

        // Create tilemap
        planet.tilemap.create();

        // Create rover instead of ship
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setCollideWorldBounds(true);

        // Set up camera to follow rover
        this.cameraSystem.setFollow(this.player);
        this.cameraSystem.setZoomLevel(2);

        // Add collisions between rover and tilemap
        const tilemap = planet.tilemap.getTilemap();
        const groundLayer = tilemap.getLayer('ground').tilemapLayer;
        this.physics.add.collider(this.player, groundLayer);

        // Add UI elements for planet info
        this.add.text(16, 16, `Planet: ${planet.name}`, {
            color: '#ffffff',
            fontSize: '24px'
        });
        this.add.text(16, 48, `Temperature: ${planet.temperature}°`, {
            color: '#ffffff',
            fontSize: '18px'
        });
        this.add.text(16, 80, 'Press ESC to return to space', {
            color: '#ffffff',
            fontSize: '16px'
        });

        // Initialize controls
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update(time: number, delta: number): void {
        this.entityManager.update(delta);
        this.cameraSystem.update(delta);

        if (!this.cursors || !this.player) return;

        // Handle player movement
        const playerPhysics = this.player.body as Phaser.Physics.Arcade.Body;
        if (playerPhysics) {
            if (this.cursors.left?.isDown) {
                playerPhysics.setVelocityX(-160);
            } else if (this.cursors.right?.isDown) {
                playerPhysics.setVelocityX(160);
            } else {
                playerPhysics.setVelocityX(0);
            }

            if (this.cursors.up?.isDown) {
                playerPhysics.setVelocityY(-160);
            } else if (this.cursors.down?.isDown) {
                playerPhysics.setVelocityY(160);
            } else {
                playerPhysics.setVelocityY(0);
            }
        }

        // Check for return to space
        const keyboard = this.input.keyboard;
        if (keyboard.addKey('ESC').isDown && !this.transitioning) {
            this.returnToSpace();
        }
    }

    private async returnToSpace(): Promise<void> {
        if (this.transitioning) return;
        
        this.transitioning = true;
        await this.cameraSystem.fade();
        this.worldSystem.exitToPlanet();
        this.scene.start('SpaceScene');
        this.transitioning = false;
    }
}