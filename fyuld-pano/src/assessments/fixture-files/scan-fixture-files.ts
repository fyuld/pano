import { NotApplicable } from '../../datamodel'
import { ScannedRow } from '../../datamodel/entities/scanned-row'

export const scanFixtureFiles = (files: string[]): ScannedRow[] => {
  const occurrences: ScannedRow[] = []
  for (const file of files) {
    if (!file.toLowerCase().includes('fixture')) continue
    occurrences.push({ file, line: NotApplicable })
  }
  return occurrences
}
