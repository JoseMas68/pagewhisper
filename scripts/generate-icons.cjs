/**
 * Simple icon generator script
 * Run with: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Simple SVG to PNG conversion placeholder
// In production, you'd use a library like sharp or canvas

const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#3b82f6"/>
  <g transform="translate(${size * 0.2}, ${size * 0.25})">
    <path d="M${size * 0.25} ${size * 0.06}L${size * 0.5} ${size * 0.25}L${size * 0.75} ${size * 0.06}" stroke="white" stroke-width="${size * 0.075}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${size * 0.1} ${size * 0.25}L${size * 0.35} ${size * 0.44}L${size * 0.6} ${size * 0.25}" stroke="white" stroke-width="${size * 0.075}" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, ${size * 0.04})"/>
    <path d="M${size * 0.1} ${size * 0.34}L${size * 0.35} ${size * 0.53}L${size * 0.6} ${size * 0.34}" stroke="white" stroke-width="${size * 0.075}" stroke-linecap="round" stroke-linejoin="round" transform="translate(${size * 0.07}, ${size * 0.08})"/>
  </g>
</svg>`;

  const iconPath = path.join(__dirname, '../public/icons', `icon-${size}.svg`);
  fs.writeFileSync(iconPath, svg);
  console.log(`Generated: icon-${size}.svg`);
});

console.log('\nIcons generated! For production, convert these SVG files to PNG using:');
console.log('1. Online tools like https://cloudconvert.com/svg-to-png');
console.log('2. Design tools like Figma or Illustrator');
console.log('3. Command line tools like sharp (npm install sharp)');
