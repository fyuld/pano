import { evaluateConstraint } from './evaluate-constraint'
import { Principle } from '../datamodel'
import { ViolationRow } from './violation-to-be-renamed-to-remark'

export type PrincipleVerdict = {
  principle: Principle
  violations: ViolationRow[]
  mdFile?: string
}

export const runPrinciples = (
  principles: Principle[],
  doc: Record<string, unknown>
): PrincipleVerdict[] => {
  const verdicts: PrincipleVerdict[] = []
  for (const principle of principles) {
    const violations: ViolationRow[] = []
    for (const constraint of principle.constraints) {
      for (const node of evaluateConstraint(doc, constraint)) {
        violations.push(node as ViolationRow)
      }
    }
    verdicts.push({
      principle,
      violations,
    })
  }
  return verdicts
}
