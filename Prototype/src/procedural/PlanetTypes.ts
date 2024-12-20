export interface PlanetConfig {
    id: string;
    name: string;
    color: number;
    description?: string;
}

export const PLANET_CONFIGS: { [key: string]: PlanetConfig } = {
    'MINDOX': {
        id: 'MINDOX',
        name: 'Mindox',
        color: 0x00ff00,  // Green color
        description: 'Home of the mysterious Mindox civilization'
    }
};
