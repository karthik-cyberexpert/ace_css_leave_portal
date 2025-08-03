import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple PNG file (1x1 black pixel)
// This is a minimal valid PNG file
const pngData = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, // IHDR chunk length (13 bytes)
  0x49, 0x48, 0x44, 0x52, // IHDR
  0x00, 0x00, 0x00, 0x01, // Width: 1
  0x00, 0x00, 0x00, 0x01, // Height: 1
  0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: 6 (RGBA), Compression: 0, Filter: 0, Interlace: 0
  0x1F, 0x15, 0xC4, 0x89, // CRC
  0x00, 0x00, 0x00, 0x0A, // IDAT chunk length (10 bytes)
  0x49, 0x44, 0x41, 0x54, // IDAT
  0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Compressed data
  0xE2, 0x21, 0xBC, 0x33, // CRC
  0x00, 0x00, 0x00, 0x00, // IEND chunk length (0 bytes)
  0x49, 0x45, 0x4E, 0x44, // IEND
  0xAE, 0x42, 0x60, 0x82  // CRC
]);

const testImagePath = path.join(__dirname, 'test-certificate.png');
fs.writeFileSync(testImagePath, pngData);

console.log('Test PNG image created:', testImagePath);
console.log('File size:', fs.statSync(testImagePath).size, 'bytes');

// Verify it's a valid PNG by checking the header
const fileBuffer = fs.readFileSync(testImagePath);
const isPNG = fileBuffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
console.log('Valid PNG file:', isPNG);
