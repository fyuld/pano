import { Occurrence, Finding } from '../../datamodel'

export const findDuplicateStringLiterals = (
  occurrences: Occurrence[]
): Finding[] => {
  const counts = new Map<string, number>()
  for (const o of occurrences) {
    const v = o.value as string
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return occurrences
    .filter((o) => (counts.get(o.value as string) ?? 0) > 1)
    .map((o): Finding => ({ ...o, numUsed: counts.get(o.value as string) }))
    .sort((a, b) => (a.value as string).localeCompare(b.value as string))
}
