import { NotApplicable } from './common'

export type ScannedRow = {
  file: string
  line: number | NotApplicable
  [key: string]: unknown
}
