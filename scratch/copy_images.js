const fs = require('fs');
const path = require('path');

const src192 = path.resolve(__dirname, '../assets/favicon.png');
const dest192 = path.resolve(__dirname, '../public/icon-192.png');
const src512 = path.resolve(__dirname, '../assets/android-icon-foreground.png');
const dest512 = path.resolve(__dirname, '../public/icon-512.png');

try {
  fs.copyFileSync(src192, dest192);
  console.log(`Copied ${src192} to ${dest192}`);
  fs.copyFileSync(src512, dest512);
  console.log(`Copied ${src512} to ${dest512}`);
  console.log('Successfully copied PWA icons to the public directory!');
} catch (error) {
  console.error('Error copying icons:', error.message);
  process.exit(1);
}
