import { Scene } from 'phaser';
import { OrbitSystem } from '../procedural/OrbitSystem';
import { Sentinel } from '../entities/Sentinel';
import { Proton } from '../entities/Proton';
import { SystemConstants } from '../procedural/SystemConstants';
import { DialogManager } from '../ui/DialogManager';
import { MindoxStation } from '../entities/MindoxStation';

export class ProceduralTestScene extends Scene {
    private orbitSystem!: OrbitSystem;
    private ship!: Sentinel;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private grid!: Phaser.GameObjects.Graphics;
    private starfield!: Phaser.GameObjects.Group;
    private positionText!: Phaser.GameObjects.Text;
    private refillButton!: Phaser.GameObjects.Container;
    private music!: Phaser.Sound.BaseSound;
    private musicButton!: Phaser.GameObjects.Container;
    private isMusicPlaying: boolean = false;
    private landingIndicator?: Phaser.GameObjects.Text;
    private solarEnergyText?: Phaser.GameObjects.Text;
    private lastSolarChargeTime: number = 0;
    private sunArrow?: Phaser.GameObjects.Container;
    private dialogManager!: DialogManager;
    private mindoxRelations: number = 0;
    private robotTalkSound?: Phaser.Sound.BaseSound;
    private mindoxStations: MindoxStation[] = [];

    constructor() {
        super({ key: 'ProceduralTestScene' });
    }

    preload() {
        // Load ship sprites
        const assets = [
            { key: 'sentinel', path: 'assets/sprites/Sentinel.01.png' },
            { key: 'sentinel_thrust', path: 'assets/sprites/Sentinel_02.png' },
            { key: 'sentinel_damaged', path: 'assets/sprites/Sentinel.03.png' },
            { key: 'sentinel_stealth', path: 'assets/sprites/Sentinel.04.png' },
            { key: 'sentinel_combat', path: 'assets/sprites/Sentinel.05.png' }
        ];

        assets.forEach(asset => {
            this.load.image(asset.key, asset.path);
        });

        // Load proton animation frames
        this.load.image('proton_0001', 'assets/sprites/ProtonAnimation_0001.png');
        this.load.image('proton_0002', 'assets/sprites/ProtonAnimation_0002.png');

        // Load music and sounds
        this.load.audio('background_music', 'assets/sound/tunetank.com_3802_stasis_by_finval.mp3');
        this.load.audio('engine_loop', 'assets/sound/engine_loop.wav');
        this.load.audio('laser_sound', 'assets/sound/Laser_09.wav');
        this.load.audio('solarCharge', 'assets/sound/SolarCharge_Loop.wav');
        this.load.image('mindox_zero', 'assets/sprites/Mindox_Zero.png');
        this.load.audio('robot_talk', 'assets/sound/Robot_Talk_02.wav');

        // Load Mindox Station sprites
        this.load.image('mindox_station_0001', 'assets/sprites/Mindox_Station_0001.png');
        this.load.image('mindox_station_0002', 'assets/sprites/Mindox_Station_0002.png');
    }

    create() {
        // Create starfield first (background layer)
        this.createStarfield();

        // Create grid (middle layer)
        this.createGrid();

        // Set up the camera bounds
        this.cameras.main.setBounds(
            -SystemConstants.SYSTEM_RADIUS,
            -SystemConstants.SYSTEM_RADIUS,
            SystemConstants.SYSTEM_RADIUS * 2,
            SystemConstants.SYSTEM_RADIUS * 2
        );

        // Set up physics world bounds
        this.physics.world.setBounds(
            -SystemConstants.SYSTEM_RADIUS,
            -SystemConstants.SYSTEM_RADIUS,
            SystemConstants.SYSTEM_RADIUS * 2,
            SystemConstants.SYSTEM_RADIUS * 2
        );

        // Initialize the orbit system
        this.orbitSystem = new OrbitSystem(this);
        this.orbitSystem.initialize();

        // Create and position the player ship
        this.ship = new Sentinel(
            this,
            0,  // Start at center X
            SystemConstants.PLANET_ORBITS[0]  // Start at first planet orbit
        );
        this.ship.setDepth(20); // Ensure ship is above celestial bodies

        // Setup controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Setup shooting with spacebar
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.ship && this.ship.getSolarLevel() >= 100) {  // Check if enough solar power
                // Consume solar power
                this.ship.consumeSolar(100);
                
                // Create proton
                new Proton(
                    this,
                    this.ship.x,
                    this.ship.y,
                    this.ship.rotation - Math.PI/2  // Adjust for Phaser's rotation system
                );
                
                // Play laser sound
                this.sound.play('laser_sound', { volume: 0.3 });
            }
        });

        // Create proton animation
        Proton.createAnimation(this);

        // Make camera follow the ship
        this.cameras.main.startFollow(this.ship);
        this.cameras.main.setZoom(0.5); // Zoom out to see more of the system

        // Setup combat and stealth mode keys
        this.input.keyboard.on('keydown-C', () => {
            this.ship.enterCombatMode();
        });

        this.input.keyboard.on('keydown-S', () => {
            this.ship.enterStealthMode();
        });

        // Initialize robot talk sound
        this.robotTalkSound = this.sound.add('robot_talk');

        // Setup landing key
        this.input.keyboard.on('keydown-L', () => {
            if (!this.ship) return;

            if (this.ship.isParented()) {
                // Take off
                this.ship.unconstrain();
                if (this.planetNameText) {
                    this.planetNameText.setVisible(false);
                }
            } else {
                // Try to land on nearest celestial body
                const nearestBody = this.findNearestLandableBody();
                if (nearestBody && this.isInLandingRange(nearestBody)) {
                    this.ship.constrainTo(nearestBody);
                    
                    // Check if landing on Mindox
                    const planetConfig = nearestBody.getPlanetConfig();
                    if (planetConfig?.id === 'MINDOX') {
                        this.showMindoxDialog();
                    }
                }
            }
        });

        // Add position display
        this.positionText = this.add.text(16, 80, '', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(30);

        // Add solar energy display
        this.solarEnergyText = this.add.text(16, 16, 'SOLAR: 1000/1000', {
            fontSize: '20px',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(30);

        // Initialize music
        this.music = this.sound.add('background_music', {
            volume: 0.5,
            loop: true
        });
        this.music.play();  // Start playing music immediately
        this.isMusicPlaying = true;  // Set initial state for music toggle

        // Add music toggle button
        this.createMusicButton();

        // Create sun direction arrow
        this.createSunArrow();

        // Initialize dialog manager
        this.dialogManager = new DialogManager(this);

        // Create Mindox stations
        this.createMindoxStations();
    }

    private createGrid() {
        this.grid = this.add.graphics();
        this.grid.lineStyle(2, 0x4444ff, 0.3); // Bright blue lines with 0.3 opacity

        // Draw major grid lines
        const gridSize = SystemConstants.GRID_CELL_SIZE;
        const numCells = Math.ceil(SystemConstants.SYSTEM_RADIUS * 2 / gridSize);
        const startX = -SystemConstants.SYSTEM_RADIUS;
        const startY = -SystemConstants.SYSTEM_RADIUS;

        // Draw vertical lines
        for (let i = 0; i <= numCells; i++) {
            const x = startX + (i * gridSize);
            this.grid.moveTo(x, startY);
            this.grid.lineTo(x, -startY);
        }

        // Draw horizontal lines
        for (let i = 0; i <= numCells; i++) {
            const y = startY + (i * gridSize);
            this.grid.moveTo(startX, y);
            this.grid.lineTo(-startX, y);
        }

        // Draw coordinate axes with higher opacity
        this.grid.lineStyle(3, 0x6666ff, 0.8);
        // X-axis
        this.grid.moveTo(-SystemConstants.SYSTEM_RADIUS, 0);
        this.grid.lineTo(SystemConstants.SYSTEM_RADIUS, 0);
        // Y-axis
        this.grid.moveTo(0, -SystemConstants.SYSTEM_RADIUS);
        this.grid.lineTo(0, SystemConstants.SYSTEM_RADIUS);

        this.grid.strokePath();
        this.grid.setDepth(1); // Above starfield but below celestial bodies
    }

    private createStarfield() {
        this.starfield = this.add.group();
        
        // Create more stars for a denser field
        const numStars = 2000;
        const radius = SystemConstants.SYSTEM_RADIUS;

        for (let i = 0; i < numStars; i++) {
            const x = Phaser.Math.Between(-radius, radius);
            const y = Phaser.Math.Between(-radius, radius);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const brightness = Phaser.Math.FloatBetween(0.3, 1);
            
            // Create a star as a circle
            const star = this.add.circle(x, y, size, 0xffffff);
            star.setAlpha(brightness);
            this.starfield.add(star);
        }

        // Add some colored stars for variety
        const colors = [0xffcccc, 0xccffcc, 0xccccff, 0xffffcc];
        const numColoredStars = 200;

        for (let i = 0; i < numColoredStars; i++) {
            const x = Phaser.Math.Between(-radius, radius);
            const y = Phaser.Math.Between(-radius, radius);
            const size = Phaser.Math.FloatBetween(1, 3);
            const brightness = Phaser.Math.FloatBetween(0.5, 1);
            const color = Phaser.Utils.Array.GetRandom(colors);
            
            const star = this.add.circle(x, y, size, color);
            star.setAlpha(brightness);
            this.starfield.add(star);
        }
    }

    private createRefillButton() {
        // Calculate position relative to the game canvas
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const buttonWidth = 200;
        const buttonHeight = 40;
        const padding = 10;
        
        // Position at bottom center of the screen
        const x = gameWidth / 2;
        const y = gameHeight - buttonHeight - padding;

        // Create button background with explicit size and position
        const background = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x4444ff);
        
        // Create button text
        const text = this.add.text(0, 0, 'REFILL SOLAR', {
            fontSize: '20px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Create container and add components
        this.refillButton = this.add.container(x, y, [background, text]);
        this.refillButton.setSize(buttonWidth, buttonHeight); // Set clickable area
        this.refillButton.setInteractive({ useHandCursor: true }); // Make container interactive
        this.refillButton.setDepth(30);
        this.refillButton.setScrollFactor(0); // Keep button fixed on screen

        // Add hover effects to container
        this.refillButton.on('pointerover', () => {
            background.setFillStyle(0x6666ff);
        });

        this.refillButton.on('pointerout', () => {
            background.setFillStyle(0x4444ff);
        });

        // Add click handler to container
        this.refillButton.on('pointerdown', () => {
            // Visual feedback
            background.setFillStyle(0x8888ff);
            
            // Refill solar
            if (this.ship) {
                this.ship.rechargeSolar(1000);
                
                // Create flash effect at ship's position
                const flash = this.add.circle(
                    this.ship.x,
                    this.ship.y,
                    50,
                    0x4444ff,
                    0.8
                );
                flash.setDepth(25);

                // Animate the flash
                this.tweens.add({
                    targets: flash,
                    scale: 2,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power2',
                    onComplete: () => {
                        flash.destroy();
                    }
                });
            }

            // Reset button color after short delay
            this.time.delayedCall(100, () => {
                background.setFillStyle(0x4444ff);
            });
        });

        // Debug helper - draw bounds of clickable area
        if (this.game.config.physics?.arcade?.debug) {
            const bounds = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0xff0000, 0.2);
            this.refillButton.add(bounds);
        }
    }

    private createMusicButton() {
        const buttonWidth = 40;
        const buttonHeight = 40;
        const padding = 10;
        
        // Position at top-right corner
        const x = this.scale.width - buttonWidth/2 - padding;
        const y = buttonHeight/2 + padding;

        // Create button background
        const background = this.add.circle(0, 0, buttonWidth/2, 0x4444ff);
        
        // Create button text
        const text = this.add.text(0, 0, '♪', {
            fontSize: '24px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Create container and add components
        this.musicButton = this.add.container(x, y, [background, text]);
        this.musicButton.setSize(buttonWidth, buttonHeight);
        this.musicButton.setInteractive({ useHandCursor: true });
        this.musicButton.setDepth(30);
        this.musicButton.setScrollFactor(0);

        // Add hover effects
        this.musicButton.on('pointerover', () => {
            background.setFillStyle(0x6666ff);
        });

        this.musicButton.on('pointerout', () => {
            background.setFillStyle(0x4444ff);
        });

        // Add click handler
        this.musicButton.on('pointerdown', () => {
            background.setFillStyle(0x8888ff);
            
            if (this.isMusicPlaying) {
                this.music.pause();
                text.setText('♪');
                this.isMusicPlaying = false;
            } else {
                this.music.play();
                text.setText('◼');
                this.isMusicPlaying = true;
            }

            this.time.delayedCall(100, () => {
                background.setFillStyle(0x4444ff);
            });
        });
    }

    private createSunArrow() {
        const gameWidth = this.cameras.main.width;
        
        // Create a container for the arrow and label
        this.sunArrow = this.add.container(gameWidth - 100, 60);
        this.sunArrow.setScrollFactor(0);
        this.sunArrow.setDepth(100);

        // Create the arrow
        const arrow = this.add.triangle(0, 0, 0, -15, 10, 5, -10, 5, 0xffff00);
        this.sunArrow.add(arrow);

        // Add "SUN" label
        const label = this.add.text(0, 15, 'SUN', {
            fontSize: '14px',
            color: '#ffff00'
        }).setOrigin(0.5);
        this.sunArrow.add(label);

        // Add background circle
        const bg = this.add.circle(0, 0, 25, 0x000000, 0.5);
        this.sunArrow.add(bg);
        bg.setDepth(-1);
    }

    private getLandingRange(body: any): number {
        // Base landing range
        const baseRange = 100;
        
        // Add the body's radius to the range
        if (body.type === 'PROTOSTAR') {
            return baseRange + SystemConstants.PROTOSTAR_RADIUS;
        } else if (body.type === 'PLANET') {
            return baseRange + SystemConstants.PLANET_RADIUS;
        } else {
            return baseRange + SystemConstants.SATELLITE_RADIUS;
        }
    }

    private findNearestLandableBody(): Parentable | null {
        if (!this.ship || !this.orbitSystem) return null;

        let nearestBody: Parentable | null = null;
        let nearestDistance = Infinity;

        // Check all celestial bodies
        this.orbitSystem.getBodies().forEach(body => {
            // Skip the protostar - can't land on it
            if (body.type === 'PROTOSTAR') return;

            const distance = Phaser.Math.Distance.Between(
                this.ship!.x,
                this.ship!.y,
                body.x,
                body.y
            );

            // Get landing range for this specific body
            const landingRange = this.getLandingRange(body);

            if (distance < nearestDistance && distance <= landingRange) {
                nearestDistance = distance;
                nearestBody = body;
            }
        });

        return nearestBody;
    }

    private isInLandingRange(body: Parentable): boolean {
        if (!this.ship) return false;

        const landingRange = this.getLandingRange(body);
        const distance = Phaser.Math.Distance.Between(
            this.ship.x,
            this.ship.y,
            body.x,
            body.y
        );

        const inRange = distance <= landingRange;

        // Visual feedback when in landing range
        if (inRange && !this.landingIndicator) {
            this.landingIndicator = this.add.text(16, 120, 'LANDING AVAILABLE - PRESS L', {
                fontSize: '20px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }).setScrollFactor(0).setDepth(30);
        } else if (!inRange && this.landingIndicator) {
            this.landingIndicator.destroy();
            this.landingIndicator = undefined;
        }

        return inRange;
    }

    private showMindoxDialog(): void {
        // Play robot talk sound
        this.robotTalkSound?.play();

        this.dialogManager.show({
            avatar: 'mindox_zero',
            message: 'Greetings, traveler. I am Zero, leader of the Mindox. Will you trade 100 solar energy for our alliance?',
            buttons: [
                {
                    text: 'Yes',
                    callback: () => {
                        if (this.ship.getSolarEnergy() >= 100) {
                            this.ship.consumeSolar(100);
                            this.mindoxRelations += 10;
                            this.dialogManager.show({
                                avatar: 'mindox_zero',
                                message: 'Your offering pleases us. Our alliance grows stronger.',
                                buttons: [{ 
                                    text: 'Close',
                                    callback: () => {
                                        this.dialogManager.hide();
                                        this.ship.unconstrain(); // Take off after dialog
                                    }
                                }]
                            });
                        } else {
                            this.dialogManager.show({
                                avatar: 'mindox_zero',
                                message: 'You do not have enough solar energy to trade.',
                                buttons: [{ 
                                    text: 'Close',
                                    callback: () => {
                                        this.dialogManager.hide();
                                        this.ship.unconstrain(); // Take off after dialog
                                    }
                                }]
                            });
                        }
                    }
                },
                {
                    text: 'No',
                    callback: () => {
                        this.mindoxRelations -= 10;
                        this.dialogManager.show({
                            avatar: 'mindox_zero',
                            message: 'Do not anger the Mindox!',
                            buttons: [{ 
                                text: 'Close',
                                callback: () => {
                                    this.dialogManager.hide();
                                    this.ship.unconstrain(); // Take off after dialog
                                }
                            }]
                        });
                    }
                }
            ]
        });
    }

    private createMindoxStations() {
        // Find the Mindox planet
        const mindoxPlanet = this.orbitSystem?.getBodies().find(body => 
            body.getPlanetConfig()?.id === 'MINDOX'
        );

        if (mindoxPlanet) {
            // Create the station animation
            MindoxStation.createAnimation(this);

            // Create 5 stations at different angles
            const baseDistance = SystemConstants.PLANET_RADIUS * 2; // Distance from planet surface
            const baseSpeed = 0.2; // Base rotation speed
            
            for (let i = 0; i < 5; i++) {
                // Randomize the orbit parameters for each station
                const angle = (i * Math.PI * 2 / 5) + Math.random() * 0.5; // Slightly randomize starting positions
                const distance = baseDistance + Math.random() * 50; // Vary the orbit distance
                const speed = baseSpeed + (Math.random() * 0.1 - 0.05); // Vary the orbit speed
                
                // Calculate initial position
                const x = mindoxPlanet.getX() + Math.cos(angle) * distance;
                const y = mindoxPlanet.getY() + Math.sin(angle) * distance;
                
                // Create and configure the station
                const station = new MindoxStation(
                    this,
                    x,
                    y,
                    distance,
                    angle,
                    speed
                );
                
                // Constrain to Mindox planet
                station.constrainTo(mindoxPlanet);
                
                // Add to tracking array
                this.mindoxStations.push(station);
            }
        }
    }

    update(time: number, delta: number) {
        // Update the orbit system
        this.orbitSystem.update(delta);

        // Update ship
        if (this.ship) {
            // Only allow ship control if it has solar energy
            if (this.ship.getSolarEnergy() > 0) {
                this.ship.update();
            }
            
            // Check landing availability if not landed
            if (!this.ship.isParented()) {
                const nearestBody = this.findNearestLandableBody();
                if (nearestBody) {
                    this.isInLandingRange(nearestBody);
                } else if (this.landingIndicator) {
                    this.landingIndicator.destroy();
                    this.landingIndicator = undefined;
                }
            }

            // Update position display
            const x = Math.round(this.ship.x);
            const y = Math.round(this.ship.y);
            this.positionText.setText(`Position: (${x}, ${y})`);

            // Check if ship is in solar charging range
            const protostar = this.orbitSystem?.getBodies().find(body => body.type === 'PROTOSTAR');
            if (protostar) {
                const distance = Phaser.Math.Distance.Between(
                    this.ship.x,
                    this.ship.y,
                    protostar.x,
                    protostar.y
                );

                // If within the sun's radius plus a small margin
                if (distance <= SystemConstants.PROTOSTAR_RADIUS + 50) {
                    // Only charge and play sound if not at max energy
                    if (this.ship.getSolarEnergy() < this.ship.getMaxSolarEnergy()) {
                        // Charge every second
                        if (time - this.lastSolarChargeTime >= 1000) {
                            this.ship.addSolarEnergy(50);
                            this.lastSolarChargeTime = time;
                        }
                        this.ship.startSolarChargeSound();
                    } else {
                        this.ship.stopSolarChargeSound();
                    }
                } else {
                    this.ship.stopSolarChargeSound();
                }
            }

            // Update solar energy display with warning color
            if (this.solarEnergyText) {
                const energy = Math.floor(this.ship.getSolarEnergy());
                const maxEnergy = this.ship.getMaxSolarEnergy();
                const color = energy === 0 ? '#ff0000' : energy < 200 ? '#ffff00' : '#00ff00';
                this.solarEnergyText.setStyle({ color });
                this.solarEnergyText.setText(`SOLAR: ${energy}/${maxEnergy}`);
            }
        }

        // Update Mindox stations
        this.mindoxStations.forEach(station => station.update(time, delta));

        // Update sun arrow direction
        if (this.sunArrow && this.ship) {
            const angle = Phaser.Math.Angle.Between(
                this.ship.x,
                this.ship.y,
                0, // Sun is at 0,0
                0
            );
            // Rotate the arrow to point to the sun
            this.sunArrow.getAt(0).setRotation(angle + Math.PI/2);
        }
    }
}
