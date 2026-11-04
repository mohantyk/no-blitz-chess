/**
 * Generates icon48.png and icon128.png using the Canvas API (Node.js with canvas package).
 * Run: node generate-icons.js
 * Requires: npm install canvas
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background circle - dark chess board green
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();

  // Inner circle border
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - size * 0.05, 0, Math.PI * 2);
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = size * 0.06;
  ctx.stroke();

  // Draw a chess piece (knight emoji or simple pawn shape)
  const fontSize = Math.round(size * 0.55);
  ctx.font = `${fontSize}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♟', size / 2, size / 2 + size * 0.04);

  // Red "no" slash overlay in top-right quadrant
  const slashSize = size * 0.35;
  const slashX = size * 0.65;
  const slashY = size * 0.2;
  ctx.beginPath();
  ctx.arc(slashX, slashY, slashSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(220, 50, 50, 0.85)';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = size * 0.04;
  ctx.stroke();

  // White horizontal bar (🚫 style)
  ctx.beginPath();
  ctx.moveTo(slashX - slashSize * 0.3, slashY);
  ctx.lineTo(slashX + slashSize * 0.3, slashY);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = size * 0.05;
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

const outDir = __dirname;
[48, 128].forEach(size => {
  const buf = generateIcon(size);
  const outPath = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`Generated ${outPath}`);
});
