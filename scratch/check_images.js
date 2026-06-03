const fs = require('fs');
const path = require('path');

function getPngDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    // PNG signature check
    if (buffer.readUInt32BE(0) !== 0x89504E47) {
      console.log(`${filePath} is not a valid PNG`);
      return null;
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e.message);
    return null;
  }
}

const assets = [
  '../assets/icon.png',
  '../assets/favicon.png',
  '../assets/splash-icon.png',
  '../assets/android-icon-foreground.png'
];

assets.forEach(relPath => {
  const absPath = path.resolve(__dirname, relPath);
  const dims = getPngDimensions(absPath);
  if (dims) {
    console.log(`${path.basename(relPath)}: ${dims.width}x${dims.height}`);
  }
});
