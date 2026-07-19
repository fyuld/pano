import { Finding } from '@fyuld/pano-dm'
import { cell, columns } from './render-helpers'

export const renderMd = (rows: Finding[]): string => {
  const cols = columns(rows)
  return (
    [
      `| ${cols.join(' | ')} |`,
      `| ${cols.map(() => '---').join(' | ')} |`,
      ...rows.map((row) => `| ${cols.map((c) => cell(row[c])).join(' | ')} |`),
    ].join('\n') + '\n'
  )
}
