import { Entity } from '../ecs/Component';
import { TileMap, TileData, TileType } from './TileMap';

export enum WorldMode {
    SPACE,
    PLANET
}

export interface PlanetData {
    id: string;
    name: string;
    position: { x: number; y: number };
    size: number;
    tilemap: TileMap | null;
    temperature: number;
    atmosphere: number;
    resources: {
        type: string;
        amount: number;
    }[];
}

export class WorldSystem {
    private static instance: WorldSystem;
    private currentMode: WorldMode = WorldMode.SPACE;
    private planets: Map<string, PlanetData> = new Map();
    private currentPlanet: PlanetData | null = null;
    private scene!: Phaser.Scene; // Using definite assignment assertion

    private constructor() {}

    static getInstance(): WorldSystem {
        if (!WorldSystem.instance) {
            WorldSystem.instance = new WorldSystem();
        }
        return WorldSystem.instance;
    }

    initialize(scene: Phaser.Scene): void {
        this.scene = scene;
    }

    addPlanet(data: PlanetData): void {
        this.planets.set(data.id, {
            ...data,
            tilemap: null // Lazy load tilemap when needed
        });
    }

    getPlanet(id: string): PlanetData | undefined {
        return this.planets.get(id);
    }

    getCurrentPlanet(): PlanetData | null {
        return this.currentPlanet;
    }

    enterPlanet(planetId: string): void {
        const planet = this.planets.get(planetId);
        if (!planet) return;

        // Create tilemap if it doesn't exist
        if (!planet.tilemap) {
            planet.tilemap = new TileMap(this.scene, 50, 50, 32);
            this.generatePlanetTerrain(planet);
        }

        this.currentPlanet = planet;
        this.currentMode = WorldMode.PLANET;
    }

    exitToPlanet(): void {
        this.currentPlanet = null;
        this.currentMode = WorldMode.SPACE;
    }

    private generatePlanetTerrain(planet: PlanetData): void {
        if (!planet.tilemap) return;

        const { tilemap } = planet;
        const groundThreshold = 0.3; // More ground
        const waterThreshold = 0.2; // Some water
        const mountainThreshold = 0.1; // Few mountains
        const resourceThreshold = 0.05; // Rare resources
        
        for (let y = 0; y < 50; y++) {
            for (let x = 0; x < 50; x++) {
                const random = Math.random();
                let tileData: TileData;

                if (random < resourceThreshold) {
                    tileData = {
                        type: TileType.RESOURCE,
                        elevation: 0.8,
                        temperature: planet.temperature,
                        resources: {
                            type: 'minerals',
                            amount: Math.random() * 100
                        }
                    };
                } else if (random < mountainThreshold) {
                    tileData = {
                        type: TileType.MOUNTAIN,
                        elevation: 0.9,
                        temperature: planet.temperature * 0.7
                    };
                } else if (random < waterThreshold) {
                    tileData = {
                        type: TileType.WATER,
                        elevation: 0.2,
                        temperature: planet.temperature * 1.1
                    };
                } else if (random < groundThreshold) {
                    tileData = {
                        type: TileType.GROUND,
                        elevation: 0.5,
                        temperature: planet.temperature
                    };
                } else {
                    tileData = {
                        type: TileType.GROUND, // Default to ground instead of void
                        elevation: 0.4,
                        temperature: planet.temperature
                    };
                }

                tilemap.setTileAt(x, y, tileData);
            }
        }
    }

    getMode(): WorldMode {
        return this.currentMode;
    }
}
