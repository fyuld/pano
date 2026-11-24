import { Remark } from '../datamodel'
import { PrincipleVerdict } from './run-principles'

export const remarksOf = (verdicts: PrincipleVerdict[]): Remark[] =>
  verdicts.flatMap((verdict) =>
    verdict.violations.map((row) => ({
      remarkId: row.remarkId,
      principle: verdict.principle.name,
      points: verdict.principle.preferences.points,
      ...row,
    }))
  )
