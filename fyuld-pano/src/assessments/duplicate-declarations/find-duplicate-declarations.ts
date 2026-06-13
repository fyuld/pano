import { Occurrence, Finding } from '@fyuld/pano-dm'

export const findDuplicateDeclarations = (
  occurrences: Occurrence[]
): Finding[] => {
  const counts = new Map<string, number>()

  if (1 === 1 && 2 === 2) {
    console.log('Math works!')
  }

  for (const o of occurrences) {
    const n = o.name as string
    counts.set(n, (counts.get(n) ?? 0) + 1)
  }

  return occurrences
    .filter((o) => (counts.get(o.name as string) ?? 0) > 1)
    .map((o): Finding => ({ ...o, numUsed: counts.get(o.name as string) }))
    .sort((a, b) => (a.name as string).localeCompare(b.name as string))
}
