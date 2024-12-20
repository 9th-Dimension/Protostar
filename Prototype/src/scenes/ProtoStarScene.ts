import 'phaser';
import { Sentinel } from '../entities/Sentinel';

export class ProtoStarScene extends Phaser.Scene {
    private sentinel!: Sentinel;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private solarText!: Phaser.GameObjects.Text;
    private defconText!: Phaser.GameObjects.Text;
    private debugText!: Phaser.GameObjects.Text;
    private metricsText!: Phaser.GameObjects.Text;

    // Game state
    private solarLevel: number = 100;
    private defconLevel: number = 5;

    // Space dimensions
    private readonly SPACE_WIDTH = 5000;
    private readonly SPACE_HEIGHT = 5000;

    // Ship movement configuration
    private readonly ROTATION_SPEED = 150;    // Angular velocity when turning
    private readonly THRUST_POWER = 200;      // Forward acceleration
    private readonly DRAG = 100;              // Ship drag (higher = more stopping power)
    private readonly ANGULAR_DRAG = 100;      // Rotation drag
    private readonly MAX_VELOCITY = 200;      // Maximum speed
    private readonly SOLAR_DRAIN = 0.1;       // Solar power consumption per frame while thrusting

    constructor() {
        super({ 
            key: 'ProtoStarScene',
        });
    }

    preload() {
        // Load all sprites with error handling
        const assets = [
            { key: 'sentinel', path: 'assets/sprites/Sentinel.01.png' },
            { key: 'sentinel_thrust', path: 'assets/sprites/Sentinel.02.png' },
            { key: 'sentinel_damaged', path: 'assets/sprites/Sentinel.03.png' },
            { key: 'sentinel_stealth', path: 'assets/sprites/Sentinel.04.png' },
            { key: 'sentinel_combat', path: 'assets/sprites/Sentinel.05.png' },
            { key: 'sun', path: 'assets/sprites/Sun_01.png' },
            { key: 'mindox', path: 'assets/sprites/Mindox_01.png' },
            { key: 'alcatraz', path: 'assets/sprites/Alcatraz_01.png' },
            { key: 'cybernetix', path: 'assets/sprites/Cybernetix_01.png' }
        ];

        assets.forEach(asset => {
            this.load.image(asset.key, asset.path);
        });

        // Add load error handling
        this.load.on('loaderror', (file: any) => {
            console.error('Error loading asset:', file.key);
        });
    }

    create() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, this.SPACE_WIDTH, this.SPACE_HEIGHT);
        
        // Create starfield background
        this.createStarfield();
        
        // Create celestial bodies
        this.createCelestialBodies();

        // Create sentinel 1000 pixels below the center
        this.sentinel = new Sentinel(
            this,
            this.SPACE_WIDTH / 2,  // Center X
            this.SPACE_HEIGHT / 2 + 1000  // Center Y + 1000 pixels down
        );

        // Setup camera
        this.cameras.main.startFollow(this.sentinel);
        this.cameras.main.setBounds(0, 0, this.SPACE_WIDTH, this.SPACE_HEIGHT);

        // Setup UI
        this.createUI();

        // Setup controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Setup additional key bindings
        this.input.keyboard.on('keydown-C', () => {
            this.sentinel.enterCombatMode();
        });

        this.input.keyboard.on('keydown-S', () => {
            this.sentinel.enterStealthMode();
        });

        this.input.keyboard.on('keydown-R', () => {
            this.sentinel.repair();
        });

        this.input.keyboard.on('keydown-D', () => {
            this.sentinel.takeDamage();
        });

        // Add editor switch button
        this.createEditorSwitcher();

        // Load level data if provided
        const levelData = this.scene.settings.data?.levelData;
        if (levelData) {
            this.loadLevelData(levelData);
        }
    }

    private createStarfield(): void {
        const graphics = this.add.graphics();
        graphics.setDepth(1);

        const starLayers = [
            { count: 2000, size: { min: 1, max: 2 }, alpha: { min: 0.3, max: 0.5 } },
            { count: 1000, size: { min: 2, max: 3 }, alpha: { min: 0.5, max: 0.7 } },
            { count: 500, size: { min: 2, max: 4 }, alpha: { min: 0.7, max: 1.0 } }
        ];

        starLayers.forEach((layer) => {
            for (let i = 0; i < layer.count; i++) {
                const x = Phaser.Math.Between(0, this.SPACE_WIDTH);
                const y = Phaser.Math.Between(0, this.SPACE_HEIGHT);
                const size = Phaser.Math.Between(layer.size.min, layer.size.max);
                const alpha = Phaser.Math.FloatBetween(layer.alpha.min, layer.alpha.max);
                
                graphics.fillStyle(0xFFFFFF, alpha);
                graphics.fillCircle(x, y, size);
            }
        });
    }

    private createCelestialBodies(): void {
        const centerX = this.SPACE_WIDTH / 2;
        const centerY = this.SPACE_HEIGHT / 2;
        
        // Add sun at center with larger scale
        const sun = this.add.sprite(centerX, centerY, 'sun');
        sun.setDepth(10).setScale(2);

        // Add planets with different scales
        const mindox = this.add.sprite(centerX - 800, centerY, 'mindox');
        mindox.setDepth(10).setScale(1.5);

        const alcatraz = this.add.sprite(centerX, centerY - 1200, 'alcatraz');
        alcatraz.setDepth(10).setScale(1.5);

        const cybernetix = this.add.sprite(centerX + 1600, centerY, 'cybernetix');
        cybernetix.setDepth(10).setScale(1.5);
    }

    private createUI(): void {
        const padding = 20;
        const textStyle = {
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };

        // Game stats
        this.solarText = this.add.text(padding, padding, `SOLAR: ${this.solarLevel}%`, textStyle);
        this.solarText.setScrollFactor(0).setDepth(20);

        this.defconText = this.add.text(padding, padding + 50, `DEFCON: ${this.defconLevel}`, textStyle);
        this.defconText.setScrollFactor(0).setDepth(20);

        // Debug position
        this.debugText = this.add.text(10, 120, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(30);

        // Ship metrics
        this.metricsText = this.add.text(10, this.scale.height - 100, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(30);
    }

    private createEditorSwitcher() {
        const switchButton = this.add.rectangle(
            this.cameras.main.width - 100,
            this.cameras.main.height - 30,
            160,
            40,
            0x444444
        )
            .setScrollFactor(0)
            .setInteractive()
            .setDepth(100);

        const switchText = this.add.text(
            this.cameras.main.width - 180,
            this.cameras.main.height - 40,
            'Switch to Editor',
            {
                color: '#ffffff',
                fontSize: '16px'
            }
        )
            .setScrollFactor(0)
            .setDepth(100);

        switchButton.on('pointerdown', () => {
            this.scene.start('LevelEditorScene');
        });
    }

    private loadLevelData(objects: any[]) {
        objects.forEach(obj => {
            switch (obj.type) {
                case 'ship':
                    EntityFactory.createPlayerShip(this, obj.x, obj.y);
                    break;
                case 'asteroid':
                    EntityFactory.createAsteroid(this, obj.x, obj.y);
                    break;
                case 'station':
                    EntityFactory.createStation(this, obj.x, obj.y);
                    break;
                case 'enemy':
                    EntityFactory.createEnemyShip(this, obj.x, obj.y);
                    break;
            }
        });
    }

    update() {
        if (!this.cursors || !this.sentinel) return;
        this.sentinel.handleMovement(this.cursors);

        // Update solar level
        this.solarLevel = Math.max(0, this.solarLevel - this.SOLAR_DRAIN);
        this.solarText.setText(`SOLAR: ${Math.floor(this.solarLevel)}%`);

        // Update debug info
        const shipX = Math.floor(this.sentinel.x);
        const shipY = Math.floor(this.sentinel.y);
        this.debugText.setText(
            `Position: (${shipX}, ${shipY})\n` +
            `World Center: (${this.SPACE_WIDTH/2}, ${this.SPACE_HEIGHT/2})`
        );

        // Update metrics
        this.metricsText.setText(
            `Movement Metrics:\n` +
            `Rotation Speed: ${this.ROTATION_SPEED}\n` +
            `Thrust Power: ${this.THRUST_POWER}\n` +
            `Current Speed: ${Math.floor(this.sentinel.body.velocity.length())}\n` +
            `Max Speed: ${this.MAX_VELOCITY}\n` +
            `Drag: ${this.DRAG}`
        );
    }
}
