import { NotApplicable } from './common'
import { Finding } from './finding'
import { Principle } from './principle'

export type Remark = {
  label?: string
  file: string | NotApplicable
  package: string
  language: string
  line: number | NotApplicable
  [key: string]: unknown
}

export type PrincipleRunner = (
  principle: Principle,
  findings: Finding[]
) => Remark[]
