import 'phaser';
import { MainMenuScene } from './scenes/MainMenuScene';
import { ProtoStarScene } from './scenes/ProtoStarScene';
import { LevelEditorScene } from './scenes/LevelEditorScene';
import { ProceduralTestScene } from './scenes/ProceduralTestScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [MainMenuScene, ProceduralTestScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#000033'
};

window.onload = () => {
    new Phaser.Game(config);
};