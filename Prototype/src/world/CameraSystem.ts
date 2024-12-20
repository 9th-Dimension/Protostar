export class CameraSystem {
    private scene: Phaser.Scene;
    private camera: Phaser.Cameras.Scene2D.Camera;
    private targetZoom: number = 1;
    private zoomSpeed: number = 0.01;
    private followTarget: Phaser.GameObjects.GameObject | null = null;
    
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.camera = scene.cameras.main;
    }

    setZoomLevel(level: number, immediate: boolean = false): void {
        this.targetZoom = level;
        if (immediate) {
            this.camera.setZoom(level);
        }
    }

    setFollow(target: Phaser.GameObjects.GameObject | null): void {
        this.followTarget = target;
        if (target) {
            this.camera.startFollow(target);
        } else {
            this.camera.stopFollow();
        }
    }

    panTo(x: number, y: number, duration: number = 1000): void {
        this.camera.pan(x, y, duration, 'Power2');
    }

    update(delta: number): void {
        // Smooth zoom transition
        if (this.camera.zoom !== this.targetZoom) {
            const diff = this.targetZoom - this.camera.zoom;
            const step = diff * this.zoomSpeed * delta;
            this.camera.setZoom(this.camera.zoom + step);
        }
    }

    shake(duration: number = 100, intensity: number = 0.01): void {
        this.camera.shake(duration, intensity);
    }

    flash(duration: number = 100): void {
        this.camera.flash(duration);
    }

    fade(duration: number = 1000): Promise<void> {
        return new Promise((resolve) => {
            this.camera.fade(duration, 0, 0, 0, false, (_: any, progress: number) => {
                if (progress === 1) {
                    resolve();
                }
            });
        });
    }

    fadeIn(duration: number = 1000): void {
        this.camera.fadeIn(duration);
    }
}
