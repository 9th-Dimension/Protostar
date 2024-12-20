const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create ship sprite
const shipCanvas = createCanvas(32, 32);
const shipCtx = shipCanvas.getContext('2d');
shipCtx.fillStyle = '#00ff00';
shipCtx.beginPath();
shipCtx.moveTo(16, 0);
shipCtx.lineTo(32, 32);
shipCtx.lineTo(16, 24);
shipCtx.lineTo(0, 32);
shipCtx.closePath();
shipCtx.fill();

// Create planet sprite
const planetCanvas = createCanvas(64, 64);
const planetCtx = planetCanvas.getContext('2d');
planetCtx.fillStyle = '#ff0000';
planetCtx.beginPath();
planetCtx.arc(32, 32, 30, 0, Math.PI * 2);
planetCtx.closePath();
planetCtx.fill();

// Save the sprites
const spritesDir = path.join(__dirname, '../../public/assets/sprites');

fs.writeFileSync(
    path.join(spritesDir, 'ship_temp.png'),
    shipCanvas.toBuffer('image/png')
);

fs.writeFileSync(
    path.join(spritesDir, 'planet_temp.png'),
    planetCanvas.toBuffer('image/png')
);
