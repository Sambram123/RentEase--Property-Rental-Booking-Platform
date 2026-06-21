const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'icons');

// Copy SVG as PNG placeholder (browsers accept SVG in img src but manifest wants png)
// In production you'd use sharp or canvas to convert
sizes.forEach(size => {
  const svgPath = path.join(iconsDir, 'icon-' + size + 'x' + size + '.svg');
  const pngPath = path.join(iconsDir, 'icon-' + size + 'x' + size + '.png');
  if (fs.existsSync(svgPath)) {
    fs.copyFileSync(svgPath, pngPath);
    console.log('Copied icon-' + size + 'x' + size + '.png');
  }
});

console.log('Done!');
