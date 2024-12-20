export class SystemConstants {
    // Base measurements
    static readonly BASE_UNIT = 32;  // pixels
    static readonly SYSTEM_RADIUS = 19200 / 2;
    static readonly GRID_CELL_SIZE = 1000;

    // Celestial body sizes
    static readonly PROTOSTAR_RADIUS = 1044 / 2;
    static readonly PLANET_RADIUS = 1044 / 2;
    static readonly SATELLITE_RADIUS = 96 / 2;

    // Orbital distances (in pixels from center)
    static readonly PLANET_ORBITS = [
        2304,  // Inner planet
        3456,  // Middle planet
        4608   // Outer planet
    ];

    // Initial angles for planets (in radians)
    static readonly PLANET_INITIAL_ANGLES = [
        Math.PI / 2,    // Inner planet starts at top (90 degrees)
        Math.PI,        // Middle planet starts at left (180 degrees)
        Math.PI * 1.5   // Outer planet starts at bottom (270 degrees)
    ];

    // Orbital periods (in milliseconds)
    static readonly PLANET_PERIODS = [
        10 * 1000,  // Inner planet: 10 seconds (fastest)
        30 * 1000,  // Middle planet: 30 seconds (medium)
        60 * 1000   // Outer planet: 60 seconds (slowest)
    ];

    // Satellite parameters
    static readonly SATELLITES_PER_PLANET = 2;
    static readonly SATELLITE_ORBIT_FACTOR = 1.5;  // Multiple of planet radius
    static readonly SATELLITE_PERIOD_FACTOR = 0.3;  // Fraction of planet period

    // Colors
    static readonly COLORS = {
        PROTOSTAR: 0xffdd00,
        PLANET_1: 0x00ffff,
        PLANET_2: 0xff00ff,
        PLANET_3: 0x00ff00,
        SATELLITE: 0xaaaaaa,
        ORBIT_LINE: 0x444444
    };

    // Performance settings
    static readonly LOD_THRESHOLDS = [
        { distance: 5000, detail: 64 },   // High detail
        { distance: 10000, detail: 32 },  // Medium detail
        { distance: 15000, detail: 16 },  // Low detail
        { distance: 20000, detail: 8 }    // Minimal detail
    ];
}
