import { Component, Entity } from '../Component';

export interface InputState {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    action: boolean;
}

export class InputComponent extends Component {
    private keys: Phaser.Types.Input.Keyboard.CursorKeys & {
        w: Phaser.Input.Keyboard.Key;
        a: Phaser.Input.Keyboard.Key;
        s: Phaser.Input.Keyboard.Key;
        d: Phaser.Input.Keyboard.Key;
    };
    private scene: Phaser.Scene;
    private inputState: InputState = {
        up: false,
        down: false,
        left: false,
        right: false,
        action: false
    };

    constructor(entity: Entity, scene: Phaser.Scene) {
        super(entity);
        this.scene = scene;
        
        // Create cursor keys and WASD keys
        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
        }) as any;
    }

    update(delta: number): void {
        this.inputState.up = this.isKeyDown('up');
        this.inputState.down = this.isKeyDown('down');
        this.inputState.left = this.isKeyDown('left');
        this.inputState.right = this.isKeyDown('right');
        this.inputState.action = this.isKeyDown('action');
    }

    isKeyDown(key: string): boolean {
        switch(key) {
            case 'up':
                return this.keys.up.isDown || this.keys.w.isDown;
            case 'down':
                return this.keys.down.isDown || this.keys.s.isDown;
            case 'left':
                return this.keys.left.isDown || this.keys.a.isDown;
            case 'right':
                return this.keys.right.isDown || this.keys.d.isDown;
            case 'action':
                return this.keys.space.isDown;
            default:
                return false;
        }
    }

    getInputState(): InputState {
        return this.inputState;
    }
}
