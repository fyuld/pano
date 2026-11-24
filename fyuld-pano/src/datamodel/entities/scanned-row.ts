import { NotApplicable } from '@fyuld/pano-dm'

export type ScannedRow = {
  file: string
  line: number | NotApplicable
  [key: string]: unknown
}
