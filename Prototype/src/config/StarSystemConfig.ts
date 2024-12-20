export interface PlanetConfig {
    name: string;
    sprite: string;
    orbitRadius: number;  // Distance from star center
    orbitSpeed: number;   // Radians per frame
    scale: number;        // Visual scale
    mass: number;         // For future gravity calculations
}

export interface StarConfig {
    position: { x: number; y: number };
    scale: number;
    sprite: string;
    mass: number;         // For future gravity calculations
}

export interface StarSystemConfig {
    // Base unit for measurements (1 grid unit = X pixels)
    gridUnit: number;
    
    // Total space dimensions (in grid units)
    spaceWidth: number;
    spaceHeight: number;
    
    // Star configuration
    star: StarConfig;
    
    // Planet configurations
    planets: PlanetConfig[];
}

// Default configuration with large play area and equidistant planets
export const DEFAULT_SYSTEM_CONFIG: StarSystemConfig = {
    // Each grid unit is 500 pixels - more manageable scale
    gridUnit: 500,
    
    // Space size (192x108 grid units = 96000x54000 pixels)
    spaceWidth: 192,
    spaceHeight: 108,
    
    star: {
        position: { x: 96, y: 54 },  // Center of space
        scale: 4,
        sprite: 'sun_01',
        mass: 1000
    },
    
    planets: [
        {
            name: 'Mindox',
            sprite: 'mindox',
            orbitRadius: 40,         // 20,000 pixels from center
            orbitSpeed: 0.0001,
            scale: 7,
            mass: 100
        },
        {
            name: 'Alcatraz',
            sprite: 'alcatraz',
            orbitRadius: 40,
            orbitSpeed: 0.0001,
            scale: 7,
            mass: 100
        },
        {
            name: 'Cybernetix',
            sprite: 'cybernetix',
            orbitRadius: 40,
            orbitSpeed: 0.0001,
            scale: 7,
            mass: 100
        }
    ]
};
