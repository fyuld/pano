import { Occurrence, Finding } from '@fyuld/pano-dm'

export const findComplexConditionalExpressions = (
  occurrences: Occurrence[]
): Finding[] =>
  occurrences.filter((o) => typeof o.numTerms === 'number' && o.numTerms > 1)
