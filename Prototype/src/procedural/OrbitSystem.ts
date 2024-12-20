import { CelestialBody, CelestialBodyType } from './CelestialBody';
import { SystemConstants } from './SystemConstants';

export class OrbitSystem {
    private bodies: CelestialBody[] = [];
    private systemTime: number = 0;
    private protostar: CelestialBody;

    constructor(private scene: Phaser.Scene) {}

    initialize() {
        // Create protostar
        this.protostar = new CelestialBody(
            this.scene,
            CelestialBodyType.PROTOSTAR,
            SystemConstants.PROTOSTAR_RADIUS,
            SystemConstants.COLORS.PROTOSTAR
        );
        this.bodies.push(this.protostar);

        // Create planets
        this.createPlanets();
    }

    private createPlanets() {
        // Create planets
        const planetConfigs = [
            undefined,  // First planet
            undefined,  // Second planet
            'MINDOX'   // Third planet (Mindox)
        ];

        for (let i = 0; i < 3; i++) {
            const planet = new CelestialBody(
                this.scene,
                CelestialBodyType.PLANET,
                SystemConstants.PLANET_RADIUS,
                Object.values(SystemConstants.COLORS)[i + 1],  // Skip PROTOSTAR color
                SystemConstants.PLANET_ORBITS[i],
                SystemConstants.PLANET_PERIODS[i],
                this.protostar,
                SystemConstants.PLANET_INITIAL_ANGLES[i],
                planetConfigs[i]  // Pass planet ID if defined
            );
            
            // Create satellites for this planet
            this.createSatellites(planet);
            this.bodies.push(planet);
        }
    }

    private createSatellites(planet: CelestialBody) {
        // Create satellites for each planet
        for (let j = 0; j < SystemConstants.SATELLITES_PER_PLANET; j++) {
            const satelliteOrbit = SystemConstants.PLANET_RADIUS * 
                SystemConstants.SATELLITE_ORBIT_FACTOR * (j + 1);
            const satellitePeriod = SystemConstants.PLANET_PERIODS[0] * 
                SystemConstants.SATELLITE_PERIOD_FACTOR * (j + 1);

            const satellite = new CelestialBody(
                this.scene,
                CelestialBodyType.SATELLITE,
                SystemConstants.SATELLITE_RADIUS,
                SystemConstants.COLORS.SATELLITE,
                satelliteOrbit,
                satellitePeriod,
                planet
            );
            planet.addSatellite(satellite);
            this.bodies.push(satellite);
        }
    }

    update(delta: number) {
        this.systemTime += delta;
        this.bodies.forEach(body => body.update(delta));
    }

    getBodies(): CelestialBody[] {
        return this.bodies;
    }

    getSystemTime(): number {
        return this.systemTime;
    }

    destroy() {
        this.bodies.forEach(body => body.destroy());
        this.bodies = [];
    }
}
