import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline/promises'

export async function safelyOverwriteFile(
  filePath: string,
  content: string
): Promise<'written' | 'skipped'> {
  const dir = path.dirname(filePath)

  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(filePath, content)
    return 'written'
  }

  if (!process.stdin.isTTY) {
    return 'skipped'
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  const answer = (
    await rl.question(`${filePath} exists. Overwrite or skip? [o/s]: `)
  )
    .trim()
    .toLowerCase()
  rl.close()

  if (!answer.startsWith('o')) {
    return 'skipped'
  }

  const ext = path.extname(filePath)
  const base = path.basename(filePath, ext)
  const iso = new Date().toISOString()
  const backupPath = path.join(dir, `${base}.${iso}-backup${ext}`)
  fs.renameSync(filePath, backupPath)
  fs.writeFileSync(filePath, content)
  return 'written'
}
