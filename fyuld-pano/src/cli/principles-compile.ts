import * as fs from 'fs'
import * as path from 'path'
import { compilePrinciple } from './compile-principle'
import { Principle, FileExtension } from '../datamodel'
import { FileFormat } from '@fyuld/ldm'

export type CompiledPrinciple = {
  name: string
  out: string
}

export const principlesCompile = (
  principlesDir: string,
  outDir: string
): CompiledPrinciple[] => {
  fs.mkdirSync(outDir, { recursive: true })
  const compiled: CompiledPrinciple[] = []
  for (const file of fs.readdirSync(principlesDir)) {
    if (!file.endsWith(FileExtension.Md)) continue
    const md = fs.readFileSync(path.join(principlesDir, file), FileFormat.Utf8)
    const principle: Principle = compilePrinciple(md)
    const out = path.join(
      outDir,
      path.basename(file, FileExtension.Md) + FileExtension.Json
    )
    fs.writeFileSync(out, JSON.stringify(principle, null, 2) + '\n')
    compiled.push({ name: principle.name, out })
  }
  return compiled
}
