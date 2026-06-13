import { Finding, BehaviorScanner } from '@fyuld/pano-dm'
import { OccurrenceBucket } from './collect-occurrences'
import { findDuplicateStringLiterals } from './string-literals'
import { findComplexConditionalExpressions } from './conditional-expressions'

export type FindingBucket = { key: string; file: string; findings: Finding[] }

type FindingSpec = {
  from: string
  key: string
  file: string
  behavior: BehaviorScanner
}

const FINDING_SPECS: FindingSpec[] = [
  {
    from: 'stringLiterals',
    key: 'duplicateStringLiterals',
    file: 'duplicate-string-literals',
    behavior: findDuplicateStringLiterals,
  },
  {
    from: 'conditionalExpressions',
    key: 'complexConditionalExpressions',
    file: 'complex-conditional-expressions',
    behavior: findComplexConditionalExpressions,
  },
]

export const collectFindings = (
  buckets: OccurrenceBucket[]
): FindingBucket[] => {
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))
  return FINDING_SPECS.filter((spec) => byKey.has(spec.from)).map((spec) => ({
    key: spec.key,
    file: spec.file,
    findings: spec.behavior(byKey.get(spec.from)!.occurrences),
  }))
}
