#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteProcess = spawn('node', [
  path.join(__dirname, 'node_modules', '.bin', 'vite'),
  'preview',
  '--host', '0.0.0.0',
  '--port', '8085',
  '--config', path.join(__dirname, 'vite.config.production.ts')
], {
  stdio: 'inherit',
  cwd: __dirname
});

viteProcess.on('error', (error) => {
  console.error('Failed to start frontend:', error);
  process.exit(1);
});

viteProcess.on('exit', (code) => {
  console.log(`Frontend process exited with code ${code}`);
  process.exit(code);
});

process.on('SIGTERM', () => {
  viteProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  viteProcess.kill('SIGINT');
});
