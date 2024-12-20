import { StarSystemConfig, PlanetConfig } from '../config/StarSystemConfig';

export class StarSystem {
    private scene: Phaser.Scene;
    private config: StarSystemConfig;
    private star!: Phaser.GameObjects.Sprite;
    private planets: Array<{
        sprite: Phaser.GameObjects.Sprite;
        config: PlanetConfig;
        angle: number;
    }>;

    constructor(scene: Phaser.Scene, config: StarSystemConfig) {
        this.scene = scene;
        this.config = config;
        this.planets = [];
        this.initialize();
    }

    private initialize(): void {
        // Create the central star
        const starX = this.config.star.position.x * this.config.gridUnit;
        const starY = this.config.star.position.y * this.config.gridUnit;
        
        this.star = this.scene.add.sprite(starX, starY, this.config.star.sprite);
        this.star.setScale(this.config.star.scale);
        this.star.setDepth(5);
        
        // Add star glow effect
        const starGlow = this.scene.add.sprite(starX, starY, this.config.star.sprite);
        starGlow.setScale(this.config.star.scale * 1.2);
        starGlow.setAlpha(0.3);
        starGlow.setTint(0xffff00);
        starGlow.setDepth(4);
    }

    create(): void {
        // Create planets at calculated positions
        this.config.planets.forEach((planetConfig, index) => {
            // Calculate initial angle for equidistant placement
            const angle = (index * 2 * Math.PI) / this.config.planets.length;
            
            // Calculate position
            const orbitRadius = planetConfig.orbitRadius * this.config.gridUnit;
            const x = this.star.x + orbitRadius * Math.cos(angle);
            const y = this.star.y + orbitRadius * Math.sin(angle);
            
            // Create planet sprite
            const planet = this.scene.add.sprite(x, y, planetConfig.sprite);
            planet.setScale(planetConfig.scale);
            planet.setDepth(5);
            
            // Add planet glow
            const planetGlow = this.scene.add.sprite(x, y, planetConfig.sprite);
            planetGlow.setScale(planetConfig.scale * 1.1);
            planetGlow.setAlpha(0.3);
            planetGlow.setTint(0x00ffff);
            planetGlow.setDepth(4);
            
            // Add planet name
            this.scene.add.text(x, y - planet.displayHeight/2 - 20, 
                planetConfig.name, {
                    fontSize: '32px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4
                }).setOrigin(0.5).setDepth(6);
            
            // Store planet data
            this.planets.push({
                sprite: planet,
                config: planetConfig,
                angle: angle
            });
        });
    }

    update(delta: number): void {
        // Update planet positions based on orbit
        this.planets.forEach(planet => {
            planet.angle += planet.config.orbitSpeed * delta;
            
            const starX = this.star.x;
            const starY = this.star.y;
            const orbitRadius = planet.config.orbitRadius * this.config.gridUnit;
            
            // Calculate new position
            const x = starX + orbitRadius * Math.cos(planet.angle);
            const y = starY + orbitRadius * Math.sin(planet.angle);
            
            // Update sprite position
            planet.sprite.setPosition(x, y);
        });
    }

    // Helper method to get planet positions for minimap
    getPlanetPositions(): Array<{x: number, y: number, name: string}> {
        return this.planets.map(planet => ({
            x: planet.sprite.x,
            y: planet.sprite.y,
            name: planet.config.name
        }));
    }
}
