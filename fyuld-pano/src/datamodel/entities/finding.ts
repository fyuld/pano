import { NotApplicable } from './common'
import { Occurrence } from './occurrence'

export type Finding = {
  file: string | NotApplicable
  package: string
  language: string
  line: number | NotApplicable
  [key: string]: unknown
}

export type BehaviorScanner = (occurrences: Occurrence[]) => Finding[]
