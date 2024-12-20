import 'phaser';

export interface Parentable {
    x: number;
    y: number;
    rotation: number;
}

export class ParentableEntity {
    private parent: Parentable | null = null;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private offsetRotation: number = 0;
    private isConstrained: boolean = false;

    constructor(private entity: Phaser.GameObjects.GameObject & Parentable) {}

    public constrainTo(parent: Parentable): void {
        if (this.isConstrained) return;

        this.parent = parent;
        
        // Calculate and store offsets
        this.offsetX = this.entity.x - parent.x;
        this.offsetY = this.entity.y - parent.y;
        this.offsetRotation = this.entity.rotation - parent.rotation;
        
        this.isConstrained = true;
    }

    public unconstrain(): void {
        if (!this.isConstrained) return;
        
        // Keep current position but remove parent
        this.parent = null;
        this.isConstrained = false;
    }

    public update(): void {
        if (!this.isConstrained || !this.parent) return;

        // Update position based on parent's position and stored offsets
        this.entity.x = this.parent.x + this.offsetX;
        this.entity.y = this.parent.y + this.offsetY;
        this.entity.rotation = this.parent.rotation + this.offsetRotation;
    }

    public isParented(): boolean {
        return this.isConstrained;
    }

    public getParent(): Parentable | null {
        return this.parent;
    }
}
