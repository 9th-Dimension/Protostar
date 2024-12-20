import 'phaser';
import { ParentableEntity, Parentable } from './ParentableEntity';

export enum SentinelState {
    NORMAL = 'NORMAL',
    THRUST = 'THRUST',
    DAMAGED = 'DAMAGED',
    STEALTH = 'STEALTH',
    COMBAT = 'COMBAT',
    LANDED = 'LANDED'
}

export class Sentinel extends Phaser.Physics.Arcade.Sprite {
    // Movement configuration
    private readonly ROTATION_SPEED = 150;    // Angular velocity when turning
    private readonly THRUST_POWER = 200;      // Forward acceleration
    private readonly DRAG = 100;              // Ship drag (higher = more stopping power)
    private readonly ANGULAR_DRAG = 100;      // Rotation drag
    private readonly MAX_VELOCITY = 200;      // Maximum speed
    
    // Resource management
    private readonly SOLAR_DRAIN = 0.5;       // Solar power consumption per frame while thrusting
    private readonly MAX_SOLAR = 1000;        // Maximum solar power capacity
    private solarLevel: number = 1000;        // Current solar power level
    private defconLevel: number = 5;
    
    // State management
    private currentState: SentinelState = SentinelState.NORMAL;
    private stateData: Map<SentinelState, {
        sprite: string;
        scale: number;
        tint?: number;
        alpha?: number;
        maxVelocity?: number;
        rotationSpeed?: number;
        thrustPower?: number;
    }> = new Map();

    // UI elements
    private metricsText: Phaser.GameObjects.Text;
    private solarText: Phaser.GameObjects.Text;
    private defconText: Phaser.GameObjects.Text;
    private landedText: Phaser.GameObjects.Text | undefined;

    private engineSound: Phaser.Sound.BaseSound;
    private solarChargeSound?: Phaser.Sound.BaseSound;

    private parentable: ParentableEntity;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'sentinel');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set depth to appear above celestial bodies
        this.setDepth(20);

        // Initialize parenting system
        this.parentable = new ParentableEntity(this);

        // Initialize engine sound
        this.engineSound = scene.sound.add('engine_loop', {
            volume: 0.3,
            loop: true
        });

        // Initialize solar charge sound
        this.solarChargeSound = scene.sound.add('solarCharge', { loop: true, volume: 0.5 });

        this.setupPhysics();
        this.setupStateConfigs();
        this.createUI();
    }

    private setupPhysics(): void {
        this.setDrag(this.DRAG);
        this.setAngularDrag(this.ANGULAR_DRAG);
        this.setMaxVelocity(this.MAX_VELOCITY);
        this.setCollideWorldBounds(true);
    }

    private setupStateConfigs(): void {
        // Normal state
        this.stateData.set(SentinelState.NORMAL, {
            sprite: 'sentinel',
            scale: 1,
            maxVelocity: this.MAX_VELOCITY,
            rotationSpeed: this.ROTATION_SPEED,
            thrustPower: this.THRUST_POWER
        });

        // Thrust state
        this.stateData.set(SentinelState.THRUST, {
            sprite: 'sentinel_thrust',
            scale: 1,
            tint: 0xffaa00,
            maxVelocity: this.MAX_VELOCITY * 1.5,
            rotationSpeed: this.ROTATION_SPEED * 0.8,
            thrustPower: this.THRUST_POWER * 1.5
        });

        // Landed state
        this.stateData.set(SentinelState.LANDED, {
            sprite: 'sentinel',
            scale: 1,
            alpha: 0.8,
            maxVelocity: 0,
            rotationSpeed: 0,
            thrustPower: 0
        });

        // Damaged state
        this.stateData.set(SentinelState.DAMAGED, {
            sprite: 'sentinel_damaged',
            scale: 1,
            tint: 0xff0000,
            alpha: 0.8,
            maxVelocity: this.MAX_VELOCITY * 0.6,
            rotationSpeed: this.ROTATION_SPEED * 0.7,
            thrustPower: this.THRUST_POWER * 0.5
        });

        // Stealth state
        this.stateData.set(SentinelState.STEALTH, {
            sprite: 'sentinel_stealth',
            scale: 1,
            alpha: 0.5,
            maxVelocity: this.MAX_VELOCITY * 0.8,
            rotationSpeed: this.ROTATION_SPEED * 1.2,
            thrustPower: this.THRUST_POWER * 0.7
        });

        // Combat state
        this.stateData.set(SentinelState.COMBAT, {
            sprite: 'sentinel_combat',
            scale: 1,
            tint: 0xff0000,
            maxVelocity: this.MAX_VELOCITY * 1.2,
            rotationSpeed: this.ROTATION_SPEED * 1.5,
            thrustPower: this.THRUST_POWER * 1.2
        });
    }

    private createUI(): void {
        const scene = this.scene;
        
        // Create status displays
        this.solarText = scene.add.text(16, 16, '', { 
            fontSize: '24px',
            color: '#ffffff'
        }).setScrollFactor(0);

        this.defconText = scene.add.text(16, 48, '', {
            fontSize: '24px',
            color: '#ffffff'
        }).setScrollFactor(0);

        // Create metrics display
        this.metricsText = scene.add.text(16, scene.cameras.main.height - 120, '', {
            fontSize: '16px',
            color: '#ffffff'
        }).setScrollFactor(0);

        this.updateUI();
    }

    private setState(newState: SentinelState): void {
        this.currentState = newState;
        const config = this.stateData.get(newState)!;

        // Update sprite and properties
        this.setTexture(config.sprite);
        this.setScale(config.scale);
        if (config.tint !== undefined) this.setTint(config.tint);
        if (config.alpha !== undefined) this.setAlpha(config.alpha);
        if (config.maxVelocity !== undefined) this.setMaxVelocity(config.maxVelocity);

        this.updateUI();
    }

    public getCurrentState(): SentinelState {
        return this.currentState;
    }

    public getSolarLevel(): number {
        return this.solarLevel;
    }

    public getDefconLevel(): number {
        return this.defconLevel;
    }

    public update(): void {
        // Update parenting first
        this.parentable.update();

        // Only handle movement if not landed
        if (this.currentState !== SentinelState.LANDED) {
            // Get input
            const cursors = this.scene.input.keyboard.createCursorKeys();
            this.handleMovement(cursors);
        }
        
        // Update UI
        this.updateUI();
    }

    private handleMovement(cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
        const stateConfig = this.stateData.get(this.currentState)!;
        const body = this.body as Phaser.Physics.Arcade.Body;

        // Rotation
        if (cursors.left?.isDown) {
            this.setAngularVelocity(-stateConfig.rotationSpeed!);
        } else if (cursors.right?.isDown) {
            this.setAngularVelocity(stateConfig.rotationSpeed!);
        } else {
            this.setAngularVelocity(0);
        }

        // Thrust
        if (cursors.up?.isDown && this.solarLevel > 0) {
            // Calculate thrust vector based on ship's rotation
            const thrustX = Math.cos(this.rotation - Math.PI/2) * stateConfig.thrustPower!;
            const thrustY = Math.sin(this.rotation - Math.PI/2) * stateConfig.thrustPower!;
            
            // Apply thrust
            body.setAcceleration(thrustX, thrustY);
            
            // Consume solar power
            this.solarLevel = Math.max(0, this.solarLevel - this.SOLAR_DRAIN);
            
            // Play engine sound if not already playing
            if (!this.engineSound.isPlaying) {
                this.engineSound.play();
            }
            
            // Enter thrust state if not in a special state
            if (this.currentState === SentinelState.NORMAL) {
                this.setState(SentinelState.THRUST);
            }
        } else {
            body.setAcceleration(0, 0);
            
            // Stop engine sound
            if (this.engineSound.isPlaying) {
                this.engineSound.stop();
            }
            
            // Return to normal state if was thrusting
            if (this.currentState === SentinelState.THRUST) {
                this.setState(SentinelState.NORMAL);
            }
        }
    }

    private updateUI(): void {
        // Update solar power display
        if (this.solarText) {
            this.solarText.setText(`SOLAR: ${Math.round(this.solarLevel)}/${this.MAX_SOLAR}`);
        }

        // Update DEFCON level display
        if (this.defconText) {
            this.defconText.setText(`DEFCON: ${this.defconLevel}`);
        }

        // Update metrics display
        if (this.metricsText) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            const velocity = Math.round(Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2));
            const rotation = Math.round(this.rotation * (180 / Math.PI));
            const state = this.currentState;
            
            this.metricsText.setText(
                `VELOCITY: ${velocity}\n` +
                `HEADING: ${rotation}°\n` +
                `STATE: ${state}\n` +
                `${this.currentState === SentinelState.LANDED ? 'STATUS: DOCKED' : ''}`
            );
        }
    }

    // Additional state-specific methods
    public enterCombatMode(): void {
        this.setState(SentinelState.COMBAT);
        this.defconLevel = Math.max(1, this.defconLevel - 1);
    }

    public enterStealthMode(): void {
        if (this.solarLevel >= 300) {
            this.setState(SentinelState.STEALTH);
            this.solarLevel -= 300;
        }
    }

    public takeDamage(): void {
        this.setState(SentinelState.DAMAGED);
        this.defconLevel = Math.min(5, this.defconLevel + 1);
    }

    public repair(): void {
        if (this.currentState === SentinelState.DAMAGED) {
            this.setState(SentinelState.NORMAL);
        }
    }

    public rechargeSolar(amount: number): void {
        this.solarLevel = Math.min(this.MAX_SOLAR, this.solarLevel + amount);
    }

    public consumeSolar(amount: number): void {
        this.solarLevel = Math.max(0, this.solarLevel - amount);
        // Prevent actions if no solar energy
        if (this.solarLevel <= 0) {
            this.solarLevel = 0;
            this.setVelocity(0, 0);
            this.setAngularVelocity(0);
        }
    }

    public constrainTo(parent: Parentable): void {
        // Only allow landing if not already landed
        if (this.currentState === SentinelState.LANDED) return;

        this.parentable.constrainTo(parent);
        
        // Disable physics when constrained
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocity(0, 0);
            body.setAcceleration(0, 0);
            body.setAngularVelocity(0);
            body.setImmovable(true);
        }

        // Enter landed state
        this.setState(SentinelState.LANDED);

        // Update UI to show landed status
        if (!this.landedText) {
            this.landedText = this.scene.add.text(
                this.scene.cameras.main.width - 100,
                16,
                'LANDED',
                {
                    fontSize: '24px',
                    color: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 10, y: 5 }
                }
            ).setScrollFactor(0).setDepth(30);
        }
    }

    public unconstrain(): void {
        // Only allow takeoff if currently landed
        if (this.currentState !== SentinelState.LANDED) return;

        this.parentable.unconstrain();
        
        // Re-enable physics when unconstrained
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocity(0, 0);
            body.setAcceleration(0, 0);
            body.setAngularVelocity(0);
            body.setImmovable(false);
        }

        // Return to normal state
        this.setState(SentinelState.NORMAL);

        // Remove landed text
        if (this.landedText) {
            this.landedText.destroy();
            this.landedText = undefined;
        }
    }

    public isParented(): boolean {
        return this.parentable.isParented();
    }

    public getSolarEnergy(): number {
        return this.solarLevel;
    }

    public getMaxSolarEnergy(): number {
        return this.MAX_SOLAR;
    }

    public addSolarEnergy(amount: number): void {
        this.solarLevel = Math.min(this.MAX_SOLAR, this.solarLevel + amount);
    }

    public useSolarEnergy(amount: number): boolean {
        if (this.solarLevel >= amount) {
            this.solarLevel -= amount;
            return true;
        }
        return false;
    }

    public startSolarChargeSound(): void {
        if (this.solarChargeSound && !this.solarChargeSound.isPlaying) {
            this.solarChargeSound.play();
        }
    }

    public stopSolarChargeSound(): void {
        if (this.solarChargeSound && this.solarChargeSound.isPlaying) {
            this.solarChargeSound.stop();
        }
    }
}
