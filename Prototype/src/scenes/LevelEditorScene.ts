import 'phaser';
import { EntityFactory } from '../ecs/EntityFactory';

interface EditorObject {
    type: string;
    x: number;
    y: number;
    rotation?: number;
    scale?: number;
    properties?: Record<string, any>;
}

export class LevelEditorScene extends Phaser.Scene {
    private grid!: Phaser.GameObjects.Grid;
    private currentTool: string = 'ship';
    private placedObjects: EditorObject[] = [];
    private isDragging: boolean = false;
    private lastPointerPosition: { x: number; y: number } = { x: 0, y: 0 };
    private gridSize: number = 32;
    private ui!: Phaser.GameObjects.Container;
    private previewSprite?: Phaser.GameObjects.Sprite;
    private currentLevelName: string = 'untitled';

    constructor() {
        super({ key: 'LevelEditorScene' });
    }

    preload() {
        // Load UI assets
        this.load.image('grid-cell', 'assets/editor/grid-cell.png');
        this.load.image('ui-panel', 'assets/editor/ui-panel.png');
        this.load.image('button', 'assets/editor/button.png');
    }

    create() {
        this.setupCamera();
        this.createGrid();
        this.createUI();
        this.setupInputHandlers();
        this.createSceneSwitcher();
        
        // Load test levels list
        this.loadTestLevelsList();
    }

    private createSceneSwitcher() {
        const switchButton = this.add.rectangle(
            this.cameras.main.width - 100,
            this.cameras.main.height - 30,
            160,
            40,
            0x444444
        )
            .setScrollFactor(0)
            .setInteractive()
            .setDepth(100);

        const switchText = this.add.text(
            this.cameras.main.width - 180,
            this.cameras.main.height - 40,
            'Switch to Game',
            {
                color: '#ffffff',
                fontSize: '16px'
            }
        )
            .setScrollFactor(0)
            .setDepth(100);

        switchButton.on('pointerdown', () => {
            this.scene.start('ProtoStarScene', { levelData: this.placedObjects });
        });
    }

    private createUI() {
        this.ui = this.add.container(10, 10);
        
        // Create UI panel background
        const panel = this.add.rectangle(0, 0, 200, 500, 0x222222, 0.8);
        this.ui.add(panel);

        // Add tool buttons
        const tools = ['ship', 'asteroid', 'station', 'enemy'];
        tools.forEach((tool, index) => {
            const button = this.add.rectangle(-80, -150 + (index * 50), 150, 40, 0x444444)
                .setInteractive()
                .on('pointerdown', () => this.selectTool(tool));
            
            const text = this.add.text(-120, -160 + (index * 50), tool, {
                color: '#ffffff',
                fontSize: '16px'
            });
            
            this.ui.add([button, text]);
        });

        // Add level name input
        const levelNameText = this.add.text(-120, 50, 'Level Name:', {
            color: '#ffffff',
            fontSize: '16px'
        });
        
        const levelNameInput = document.createElement('input');
        levelNameInput.type = 'text';
        levelNameInput.value = this.currentLevelName;
        levelNameInput.style.position = 'absolute';
        levelNameInput.style.left = '100px';
        levelNameInput.style.top = '200px';
        levelNameInput.style.width = '150px';
        document.body.appendChild(levelNameInput);
        
        levelNameInput.addEventListener('change', (e) => {
            this.currentLevelName = (e.target as HTMLInputElement).value;
        });

        // Add save/load buttons
        const saveButton = this.add.rectangle(-80, 100, 150, 40, 0x225522)
            .setInteractive()
            .on('pointerdown', () => this.saveLevel());
        const saveText = this.add.text(-120, 90, 'Save Level', {
            color: '#ffffff',
            fontSize: '16px'
        });

        const loadButton = this.add.rectangle(-80, 150, 150, 40, 0x222255)
            .setInteractive()
            .on('pointerdown', () => this.loadLevel());
        const loadText = this.add.text(-120, 140, 'Load Level', {
            color: '#ffffff',
            fontSize: '16px'
        });

        this.ui.add([levelNameText, saveButton, saveText, loadButton, loadText]);
        
        // Make UI fixed to camera
        this.ui.setScrollFactor(0);

        // Cleanup input element when scene is destroyed
        this.events.on('shutdown', () => {
            document.body.removeChild(levelNameInput);
        });
    }

    private async loadTestLevelsList() {
        try {
            const response = await fetch('/levels/index.json');
            if (response.ok) {
                const levels = await response.json();
                this.createLevelsList(levels);
            }
        } catch (error) {
            console.log('No levels index found, creating new one');
            this.saveLevelsIndex([]);
        }
    }

    private createLevelsList(levels: string[]) {
        const listContainer = this.add.container(this.cameras.main.width - 200, 100);
        
        const background = this.add.rectangle(0, 0, 180, 400, 0x222222, 0.8);
        listContainer.add(background);

        const title = this.add.text(-80, -180, 'Test Levels', {
            color: '#ffffff',
            fontSize: '18px'
        });
        listContainer.add(title);

        levels.forEach((level, index) => {
            const text = this.add.text(-80, -150 + (index * 30), level, {
                color: '#ffffff',
                fontSize: '14px'
            })
                .setInteractive()
                .on('pointerdown', () => this.loadTestLevel(level));
            listContainer.add(text);
        });

        listContainer.setScrollFactor(0);
    }

    private async loadTestLevel(levelName: string) {
        try {
            const response = await fetch(`/levels/${levelName}.json`);
            if (response.ok) {
                const levelData = await response.json();
                this.loadLevelData(levelData);
                this.currentLevelName = levelName;
            }
        } catch (error) {
            console.error('Error loading test level:', error);
        }
    }

    private async saveLevelsIndex(levels: string[]) {
        const saveButton = this.add.rectangle(-80, 200, 150, 40, 0x225522)
            .setInteractive()
            .on('pointerdown', async () => {
                try {
                    await fetch('/levels/index.json', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(levels)
                    });
                } catch (error) {
                    console.error('Error saving levels index:', error);
                }
            });
    }

    private saveLevel() {
        const levelData = {
            version: '1.0',
            objects: this.placedObjects
        };

        // Save to test levels directory
        fetch(`/levels/${this.currentLevelName}.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(levelData)
        }).then(() => {
            // Update levels index
            this.loadTestLevelsList();
        }).catch(error => {
            console.error('Error saving level:', error);
            
            // Fallback to download if server save fails
            const dataStr = JSON.stringify(levelData);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportName = `${this.currentLevelName}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportName);
            linkElement.click();
        });
    }

    private setupCamera() {
        // Enable camera drag
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                this.isDragging = true;
                this.lastPointerPosition = { x: pointer.x, y: pointer.y };
            }
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragging) {
                const deltaX = pointer.x - this.lastPointerPosition.x;
                const deltaY = pointer.y - this.lastPointerPosition.y;
                
                this.cameras.main.scrollX -= deltaX;
                this.cameras.main.scrollY -= deltaY;
                
                this.lastPointerPosition = { x: pointer.x, y: pointer.y };
            }
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        // Enable zoom with mouse wheel
        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            const zoom = this.cameras.main.zoom;
            this.cameras.main.zoom -= deltaY * 0.001;
            this.cameras.main.zoom = Phaser.Math.Clamp(this.cameras.main.zoom, 0.5, 2);
        });
    }

    private createGrid() {
        const width = 2000;
        const height = 2000;
        
        // Create grid lines
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x444444, 0.3);

        // Draw vertical lines
        for (let x = 0; x <= width; x += this.gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }

        // Draw horizontal lines
        for (let y = 0; y <= height; y += this.gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }

        graphics.strokePath();
    }

    private setupInputHandlers() {
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown() && !this.isDragging) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const snappedX = Math.round(worldPoint.x / this.gridSize) * this.gridSize;
                const snappedY = Math.round(worldPoint.y / this.gridSize) * this.gridSize;

                this.placeObject(snappedX, snappedY);
            }
        });

        // Preview object following mouse
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.isDragging) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const snappedX = Math.round(worldPoint.x / this.gridSize) * this.gridSize;
                const snappedY = Math.round(worldPoint.y / this.gridSize) * this.gridSize;

                if (this.previewSprite) {
                    this.previewSprite.setPosition(snappedX, snappedY);
                }
            }
        });
    }

    private selectTool(tool: string) {
        this.currentTool = tool;
        
        // Update preview sprite
        if (this.previewSprite) {
            this.previewSprite.destroy();
        }

        // Create new preview sprite based on selected tool
        this.previewSprite = this.add.sprite(0, 0, this.getAssetKeyForTool(tool))
            .setAlpha(0.5);
    }

    private getAssetKeyForTool(tool: string): string {
        // Map tools to asset keys
        const assetMap: Record<string, string> = {
            'ship': 'ship',
            'asteroid': 'asteroid',
            'station': 'station',
            'enemy': 'enemy-ship'
        };
        return assetMap[tool] || 'ship';
    }

    private placeObject(x: number, y: number) {
        const newObject: EditorObject = {
            type: this.currentTool,
            x,
            y,
            rotation: 0,
            scale: 1
        };

        this.placedObjects.push(newObject);
        
        // Create visual representation
        const sprite = this.add.sprite(x, y, this.getAssetKeyForTool(this.currentTool));
    }

    private loadLevel() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result as string;
                    try {
                        const levelData = JSON.parse(content);
                        this.loadLevelData(levelData);
                    } catch (error) {
                        console.error('Error parsing level data:', error);
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    private loadLevelData(levelData: { objects: EditorObject[] }) {
        // Clear existing objects
        this.placedObjects = [];
        this.children.list
            .filter(obj => obj instanceof Phaser.GameObjects.Sprite)
            .forEach(obj => obj.destroy());

        // Place new objects
        levelData.objects.forEach(obj => {
            this.placedObjects.push(obj);
            this.add.sprite(obj.x, obj.y, this.getAssetKeyForTool(obj.type))
                .setRotation(obj.rotation || 0)
                .setScale(obj.scale || 1);
        });
    }
}
