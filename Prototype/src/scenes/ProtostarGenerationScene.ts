import 'phaser';
import { Sentinel } from '../entities/Sentinel';
import { CelestialBody } from '../procedural/CelestialBody';
import { OrbitSystem } from '../procedural/OrbitSystem';
import { SystemConstants } from '../procedural/SystemConstants';

export class ProtostarGenerationScene extends Phaser.Scene {
    private sentinel!: Sentinel;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private orbitSystem!: OrbitSystem;
    private debugText!: Phaser.GameObjects.Text;
    private lastTime: number = 0;

    constructor() {
        super({ key: 'ProtostarGenerationScene' });
    }

    create() {
        // Initialize system
        this.physics.world.setBounds(
            -SystemConstants.SYSTEM_RADIUS,
            -SystemConstants.SYSTEM_RADIUS,
            SystemConstants.SYSTEM_RADIUS * 2,
            SystemConstants.SYSTEM_RADIUS * 2
        );

        // Create orbit system
        this.orbitSystem = new OrbitSystem(this);
        this.orbitSystem.initialize();

        // Create sentinel at entry point
        this.sentinel = new Sentinel(
            this,
            0,  // x center
            SystemConstants.SYSTEM_RADIUS - SystemConstants.BASE_UNIT * 10 // Bottom of system
        );

        // Setup camera
        this.cameras.main.startFollow(this.sentinel);
        this.cameras.main.setBounds(
            -SystemConstants.SYSTEM_RADIUS,
            -SystemConstants.SYSTEM_RADIUS,
            SystemConstants.SYSTEM_RADIUS * 2,
            SystemConstants.SYSTEM_RADIUS * 2
        );

        // Setup controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Create debug text
        this.debugText = this.add.text(10, 10, '', {
            color: '#00ff00',
            fontSize: '14px'
        }).setScrollFactor(0).setDepth(100);

        // Add scene switcher
        this.createSceneSwitcher();
    }

    private createSceneSwitcher() {
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
            'Switch to Main Game',
            {
                color: '#ffffff',
                fontSize: '16px'
            }
        )
            .setScrollFactor(0)
            .setDepth(100);

        switchButton.on('pointerdown', () => {
            this.scene.start('ProtoStarScene');
        });
    }

    update(time: number, delta: number) {
        if (!this.cursors || !this.sentinel) return;

        // Update orbital system
        this.orbitSystem.update(delta);

        // Update ship controls
        this.sentinel.handleMovement(this.cursors);

        // Update debug info
        this.updateDebugInfo();
    }

    private updateDebugInfo() {
        const shipPos = this.sentinel.getPosition();
        this.debugText.setText([
            `Ship Position: (${Math.round(shipPos.x)}, ${Math.round(shipPos.y)})`,
            `System Time: ${Math.round(this.orbitSystem.getSystemTime() / 1000)}s`,
            `FPS: ${Math.round(1000 / (performance.now() - this.lastTime))}`,
        ].join('\n'));
        this.lastTime = performance.now();
    }
}
