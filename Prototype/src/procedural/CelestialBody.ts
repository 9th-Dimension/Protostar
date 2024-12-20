import 'phaser';
import { Parentable } from '../entities/ParentableEntity';
import { SystemConstants } from './SystemConstants';
import { PlanetConfig, PLANET_CONFIGS } from './PlanetTypes';

export enum CelestialBodyType {
    PROTOSTAR = 'PROTOSTAR',
    PLANET = 'PLANET',
    SATELLITE = 'SATELLITE'
}

export class CelestialBody implements Parentable {
    private graphics: Phaser.GameObjects.Graphics;
    private orbitGraphics: Phaser.GameObjects.Graphics;
    private satellites: CelestialBody[] = [];
    private currentLODDetail: number = 32;
    private lastLODDistance: number = 0;
    private currentAngle: number = 0;
    public x: number = 0;
    public y: number = 0;
    public rotation: number = 0;
    private planetConfig?: PlanetConfig;

    constructor(
        private scene: Phaser.Scene,
        public type: CelestialBodyType,
        private radius: number,
        private color: number,
        private orbitRadius: number = 0,
        private orbitPeriod: number = 0,
        private parentBody?: CelestialBody,
        private initialAngle: number = 0,
        planetId?: string
    ) {
        this.graphics = scene.add.graphics();
        this.orbitGraphics = scene.add.graphics();
        this.currentAngle = initialAngle;
        
        if (planetId && PLANET_CONFIGS[planetId]) {
            this.planetConfig = PLANET_CONFIGS[planetId];
            this.color = this.planetConfig.color;
        }
        
        this.drawOrbit();
        this.draw();
        this.updatePosition();
    }

    update(delta: number) {
        if (this.orbitPeriod > 0) {
            // Update orbit position
            this.currentAngle += (2 * Math.PI) / (this.orbitPeriod * 60) * delta;
            
            if (this.parentBody) {
                // Orbit around parent body
                this.x = this.parentBody.getX() + Math.cos(this.currentAngle) * this.orbitRadius;
                this.y = this.parentBody.getY() + Math.sin(this.currentAngle) * this.orbitRadius;
            } else {
                // Orbit around origin
                this.x = Math.cos(this.currentAngle) * this.orbitRadius;
                this.y = Math.sin(this.currentAngle) * this.orbitRadius;
            }

            // Update rotation to face direction of movement
            this.rotation = this.currentAngle;
        }

        // Update graphics position
        this.graphics.setPosition(this.x, this.y);
        this.updateLOD();

        // Update satellites
        this.satellites.forEach(satellite => satellite.update(delta));
    }

    private updatePosition() {
        if (this.orbitRadius > 0) {
            if (this.parentBody) {
                // Orbit around parent body
                this.x = this.parentBody.getX() + Math.cos(this.currentAngle) * this.orbitRadius;
                this.y = this.parentBody.getY() + Math.sin(this.currentAngle) * this.orbitRadius;
            } else {
                // Orbit around origin
                this.x = Math.cos(this.currentAngle) * this.orbitRadius;
                this.y = Math.sin(this.currentAngle) * this.orbitRadius;
            }
            this.graphics.setPosition(this.x, this.y);
        }
    }

    private updateLOD() {
        const camera = this.scene.cameras.main;
        const distance = Phaser.Math.Distance.Between(
            camera.scrollX + camera.width / 2,
            camera.scrollY + camera.height / 2,
            this.getX(),
            this.getY()
        );

        // Only update if distance changed significantly
        if (Math.abs(distance - this.lastLODDistance) > 1000) {
            this.lastLODDistance = distance;
            
            // Find appropriate LOD level
            const lod = SystemConstants.LOD_THRESHOLDS.find(threshold => 
                distance < threshold.distance
            ) || SystemConstants.LOD_THRESHOLDS[SystemConstants.LOD_THRESHOLDS.length - 1];

            if (this.currentLODDetail !== lod.detail) {
                this.currentLODDetail = lod.detail;
                this.draw();
            }
        }
    }

    private draw() {
        this.graphics.clear();
        
        // Draw the main body
        this.graphics.lineStyle(1, this.color, 0.8);
        this.graphics.strokeCircle(0, 0, this.radius);
        
        // For planets, draw a grid pattern
        if (this.type === CelestialBodyType.PLANET) {
            // Draw latitude lines (horizontal)
            const latitudeCount = 8;
            const latitudeSpacing = this.radius * 2 / latitudeCount;
            for (let i = 1; i < latitudeCount; i++) {
                const y = -this.radius + (i * latitudeSpacing);
                const width = Math.sqrt(this.radius * this.radius - y * y) * 2;
                this.graphics.beginPath();
                this.graphics.moveTo(-width/2, y);
                this.graphics.lineTo(width/2, y);
                this.graphics.strokePath();
            }
            
            // Draw longitude lines (vertical)
            const longitudeCount = 12;
            for (let i = 0; i < longitudeCount; i++) {
                const angle = (i * Math.PI * 2) / longitudeCount;
                this.graphics.beginPath();
                this.graphics.moveTo(0, -this.radius);
                this.graphics.lineTo(
                    Math.sin(angle) * this.radius,
                    Math.cos(angle) * this.radius
                );
                this.graphics.strokePath();
            }
        }
        
        this.graphics.setPosition(this.x, this.y);
    }

    private drawOrbit() {
        if (this.orbitRadius > 0) {
            this.orbitGraphics.clear();
            this.orbitGraphics.lineStyle(1, SystemConstants.COLORS.ORBIT_LINE, 0.3);
            this.orbitGraphics.beginPath();
            
            const points = 64;
            const angleStep = (Math.PI * 2) / points;
            const centerX = this.parentBody ? this.parentBody.getX() : 0;
            const centerY = this.parentBody ? this.parentBody.getY() : 0;

            for (let i = 0; i <= points; i++) {
                const angle = i * angleStep;
                const x = centerX + Math.cos(angle) * this.orbitRadius;
                const y = centerY + Math.sin(angle) * this.orbitRadius;
                
                if (i === 0) {
                    this.orbitGraphics.moveTo(x, y);
                } else {
                    this.orbitGraphics.lineTo(x, y);
                }
            }

            this.orbitGraphics.closePath();
            this.orbitGraphics.strokePath();
        }
    }

    addSatellite(satellite: CelestialBody) {
        this.satellites.push(satellite);
    }

    getType(): CelestialBodyType {
        return this.type;
    }

    getX(): number {
        return this.x;
    }

    getY(): number {
        return this.y;
    }

    getRotation(): number {
        return this.rotation;
    }

    getPlanetConfig(): PlanetConfig | undefined {
        return this.planetConfig;
    }

    getName(): string {
        return this.planetConfig?.name || 'Unknown';
    }

    destroy() {
        this.graphics.destroy();
        this.orbitGraphics.destroy();
        this.satellites.forEach(satellite => satellite.destroy());
    }
}
