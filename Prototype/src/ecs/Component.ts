export abstract class Component {
    protected entity: Entity;

    constructor(entity: Entity) {
        this.entity = entity;
    }

    abstract update(delta: number): void;
}

export class Entity {
    private components: Map<string, Component> = new Map();
    
    addComponent(componentType: string, component: Component): void {
        this.components.set(componentType, component);
    }

    getComponent<T extends Component>(componentType: string): T | undefined {
        return this.components.get(componentType) as T;
    }

    removeComponent(componentType: string): void {
        this.components.delete(componentType);
    }

    update(delta: number): void {
        this.components.forEach(component => component.update(delta));
    }
}

export class EntityManager {
    private entities: Set<Entity> = new Set();
    private static instance: EntityManager;

    private constructor() {}

    static getInstance(): EntityManager {
        if (!EntityManager.instance) {
            EntityManager.instance = new EntityManager();
        }
        return EntityManager.instance;
    }

    addEntity(entity: Entity): void {
        this.entities.add(entity);
    }

    removeEntity(entity: Entity): void {
        this.entities.delete(entity);
    }

    update(delta: number): void {
        this.entities.forEach(entity => entity.update(delta));
    }
}
