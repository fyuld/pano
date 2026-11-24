import * as fs from 'fs'
import * as path from 'path'
import { PlainTextFileFormats } from '@fyuld/ldm'
import { Finding } from '../datamodel'
import { renderJson, renderCsv } from '../render'
import { FindingError } from './finding-error'

export const writeFindings = (
  findings: Finding[],
  formats: PlainTextFileFormats[],
  outDir: string,
  name: string
): Finding[] => {
  fs.mkdirSync(outDir, { recursive: true })
  for (const format of formats) {
    const f = format as string
    if (f === 'Json') {
      fs.writeFileSync(path.join(outDir, `${name}.json`), renderJson(findings))
    } else if (f === 'Csv') {
      fs.writeFileSync(path.join(outDir, `${name}.csv`), renderCsv(findings))
    } else {
      throw FindingError.unknownFormat(f)
    }
  }
  return findings
}
