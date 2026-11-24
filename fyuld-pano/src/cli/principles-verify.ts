import * as fs from 'fs'
import * as path from 'path'
import { compilePrinciple } from './compile-principle'
import { FileFormat } from '@fyuld/ldm'
import { FileExtension } from '@fyuld/pano-dm'

export type PrincipleValidation = {
  file: string
  valid: boolean
  error?: string
}

export const principlesVerify = (
  principlesDir: string
): PrincipleValidation[] => {
  const results: PrincipleValidation[] = []
  for (const file of fs.readdirSync(principlesDir)) {
    if (!file.endsWith(FileExtension.Md)) continue
    const md = fs.readFileSync(path.join(principlesDir, file), FileFormat.Utf8)
    try {
      compilePrinciple(md)
      results.push({ file, valid: true })
    } catch (error) {
      results.push({
        file,
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return results
}
