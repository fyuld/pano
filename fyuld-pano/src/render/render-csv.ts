import { Finding } from '../datamodel'
import { cell, columns } from './render-helpers'

export const renderCsv = (rows: Finding[]): string => {
  const cols = columns(rows)
  return (
    [
      cols.join(','),
      ...rows.map((row) => cols.map((c) => cell(row[c])).join(',')),
    ].join('\n') + '\n'
  )
}
