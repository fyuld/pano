import { NotApplicable } from './common'

export type Occurrence = {
  file: string | NotApplicable
  package: string
  language: string
  line: number | NotApplicable
  [key: string]: unknown
}

export type CodeScanner<Ast> = (ast: Ast) => Occurrence[]
