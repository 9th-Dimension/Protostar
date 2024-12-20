const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a tileset canvas
const tileSize = 32;
const numTiles = 5; // void, ground, water, mountain, resource
const canvas = createCanvas(tileSize * numTiles, tileSize);
const ctx = canvas.getContext('2d');

// Create tiles with more visible colors
const colors = {
    void: '#000000',
    ground: '#FFA500', // Orange for ground
    water: '#4169E1', // Royal Blue for water
    mountain: '#808080', // Gray for mountains
    resource: '#FFD700' // Gold for resources
};

Object.entries(colors).forEach(([type, color], index) => {
    ctx.fillStyle = color;
    ctx.fillRect(index * tileSize, 0, tileSize, tileSize);
    
    // Add some texture/detail
    ctx.strokeStyle = adjustColor(color, -20); // Slightly darker version of the color
    ctx.lineWidth = 2;
    
    // Draw a border
    ctx.strokeRect(index * tileSize + 2, 2, tileSize - 4, tileSize - 4);
    
    // Add some detail lines
    if (type === 'ground') {
        // Add dots for ground
        ctx.fillStyle = adjustColor(color, -30);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                ctx.fillRect(
                    index * tileSize + 6 + i * 7,
                    6 + j * 7,
                    3,
                    3
                );
            }
        }
    } else if (type === 'mountain') {
        // Add triangle for mountain
        ctx.beginPath();
        ctx.moveTo(index * tileSize + tileSize/2, 5);
        ctx.lineTo(index * tileSize + 5, tileSize - 5);
        ctx.lineTo(index * tileSize + tileSize - 5, tileSize - 5);
        ctx.closePath();
        ctx.stroke();
    } else if (type === 'water') {
        // Add wave lines for water
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            ctx.moveTo(index * tileSize + 5, 10 + i * 8);
            ctx.quadraticCurveTo(
                index * tileSize + tileSize/2, 5 + i * 8,
                index * tileSize + tileSize - 5, 10 + i * 8
            );
        }
        ctx.stroke();
    }
});

// Helper function to adjust color brightness
function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Save the tileset
const tilesDir = path.join(__dirname, '../../public/assets/tiles');
if (!fs.existsSync(tilesDir)) {
    fs.mkdirSync(tilesDir, { recursive: true });
}

fs.writeFileSync(
    path.join(tilesDir, 'planet_tiles_temp.png'),
    canvas.toBuffer('image/png')
);
