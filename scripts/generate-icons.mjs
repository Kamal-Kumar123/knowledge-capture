import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

// Minimal valid PNG (16x16 violet square) encoded as base64
const PNG_16 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAFUlEQVR42mP8z8BQz0BFwMjAwMDAAABaAAGpKQh+AAAAAElFTkSuQmCC',
  'base64',
)

const PNG_48 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAFUlEQVR42mP8z8BQz0BFwMjAwMDAAABaAAGpKQh+AAAAAElFTkSuQmCC',
  'base64',
)

const PNG_128 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAFUlEQVR42mP8z8BQz0BFwMjAwMDAAABaAAGpKQh+AAAAAElFTkSuQmCC',
  'base64',
)

mkdirSync(publicDir, { recursive: true })
writeFileSync(join(publicDir, 'icon16.png'), PNG_16)
writeFileSync(join(publicDir, 'icon48.png'), PNG_48)
writeFileSync(join(publicDir, 'icon128.png'), PNG_128)

console.log('Extension icons generated.')
