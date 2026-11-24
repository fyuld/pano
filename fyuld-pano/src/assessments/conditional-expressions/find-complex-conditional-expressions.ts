import { Occurrence, Finding } from '../../datamodel'

export const findComplexConditionalExpressions = (
  occurrences: Occurrence[]
): Finding[] =>
  occurrences.filter((o) => typeof o.numTerms === 'number' && o.numTerms > 1)
