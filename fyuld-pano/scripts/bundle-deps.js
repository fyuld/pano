const fs = require('fs')
const path = require('path')

const BUNDLED_PACKAGES = ['pano-bdd', 'pano-dm', 'pano-engine', 'pano-errors']
const packageRoot = path.join(__dirname, '..')
const repoRoot = path.join(packageRoot, '..')
const scopeDir = path.join(packageRoot, 'node_modules', '@fyuld')

const stage = () => {
  for (const name of BUNDLED_PACKAGES) {
    const source = path.join(repoRoot, `fyuld-${name}`)
    const target = path.join(scopeDir, name)
    fs.rmSync(target, { recursive: true, force: true })
    fs.mkdirSync(target, { recursive: true })
    fs.cpSync(
      path.join(source, 'package.json'),
      path.join(target, 'package.json')
    )
    fs.cpSync(path.join(source, 'dist'), path.join(target, 'dist'), {
      recursive: true,
    })
  }
}

const clean = () => {
  for (const name of BUNDLED_PACKAGES) {
    fs.rmSync(path.join(scopeDir, name), { recursive: true, force: true })
  }
}

const mode = process.argv[2]
if (mode === 'stage') stage()
else if (mode === 'clean') clean()
else throw new Error(`Unknown bundle-deps mode: ${mode}`)
