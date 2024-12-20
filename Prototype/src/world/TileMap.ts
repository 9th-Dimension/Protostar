export enum TileType {
    VOID = 0,
    GROUND = 1,
    WATER = 2,
    MOUNTAIN = 3,
    RESOURCE = 4,
    STRUCTURE = 5
}

export interface TileData {
    type: TileType;
    elevation: number;
    temperature: number;
    resources?: {
        type: string;
        amount: number;
    };
}

export class TileMap {
    private width: number;
    private height: number;
    private tileSize: number;
    private tiles: TileData[][];
    private tilemap!: Phaser.Tilemaps.Tilemap;
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene, width: number, height: number, tileSize: number) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.tiles = [];

        this.initialize();
    }

    private initialize(): void {
        // Initialize empty tilemap
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = {
                    type: TileType.VOID,
                    elevation: 0,
                    temperature: 0
                };
            }
        }
    }

    create(): void {
        // Create Phaser tilemap
        this.tilemap = this.scene.make.tilemap({
            tileWidth: this.tileSize,
            tileHeight: this.tileSize,
            width: this.width,
            height: this.height
        });

        // Add tileset
        const tileset = this.tilemap.addTilesetImage('planetTiles', 'planetTiles');
        if (!tileset) {
            console.error('Failed to load tileset');
            return;
        }

        const layer = this.tilemap.createBlankLayer('ground', tileset, 0, 0);
        if (!layer) {
            console.error('Failed to create layer');
            return;
        }
        
        // Set tiles based on our data
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                const tileIndex = this.getTileIndex(tile.type);
                if (tileIndex !== -1) {
                    layer.putTileAt(tileIndex, x, y);
                }
            }
        }

        // Set collisions for mountains and structures
        layer.setCollisionByProperty({ collides: true });
    }

    private getTileIndex(type: TileType): number {
        return type; // Since we made the enum values match the tileset indices
    }

    getTileAt(x: number, y: number): TileData | null {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.tiles[y][x];
        }
        return null;
    }

    setTileAt(x: number, y: number, data: TileData): void {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y][x] = data;
            const layer = this.tilemap.getLayer('ground').tilemapLayer;
            layer.putTileAt(this.getTileIndex(data.type), x, y);
        }
    }

    getTilemap(): Phaser.Tilemaps.Tilemap {
        if (!this.tilemap) {
            throw new Error('Tilemap not created yet');
        }
        return this.tilemap;
    }
}
