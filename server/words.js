import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const wordsPath = path.join(__dirname, 'resources', 'words.txt')
const content = fs.readFileSync(wordsPath, 'utf8').split('\n').filter(word => word.length >= 4)

export { content }