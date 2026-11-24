import * as fs from 'fs'
import * as path from 'path'
import { Remark } from '../datamodel'
import { renderJson, renderCsv } from '../render'

export const writeRemarks = (
  remarks: Remark[],
  outDir: string,
  markdown: string
): void => {
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'remarks.json'), renderJson(remarks))
  fs.writeFileSync(path.join(outDir, 'remarks.csv'), renderCsv(remarks))
  fs.writeFileSync(path.join(outDir, 'remarks.md'), markdown)
}
