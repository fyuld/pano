import * as path from 'path'
import { Occurrence, NotApplicable } from '@fyuld/pano-dm'
import { aggregateErrors, aggregateThrows } from '@fyuld/pano-errors'
import { scanIndexFiles } from './index-files'
import { scanStringLiterals } from './string-literals'
import { scanDeclarations } from './duplicate-declarations'
import { scanConditionalExpressions } from './conditional-expressions'
import { scanFixtureFiles } from './fixture-files'
import { ScannedRow } from './scanned-row'

export type OccurrenceBucket = {
  key: string
  file: string
  occurrences: Occurrence[]
}

const LANGUAGE_BY_EXT: Record<string, string> = {
  '.ts': 'typescript',
  '.tf': 'terraform',
  '.js': 'javascript',
  '.json': 'json',
}

const enrich = (rows: ScannedRow[], repoRoot: string): Occurrence[] =>
  rows.map((row) => {
    const abs = typeof row.file === 'string' ? row.file : undefined
    const rel = abs ? path.relative(repoRoot, abs) : NotApplicable
    const pkg = typeof rel === 'string' ? (rel.split('/')[0] ?? '') : ''
    const language = abs
      ? (LANGUAGE_BY_EXT[path.extname(abs)] ?? 'unknown')
      : 'unknown'
    return {
      ...row,
      file: rel,
      package: pkg,
      language,
      line: row.line ?? NotApplicable,
    }
  })

const DECLARATION_BUCKETS = [
  { key: 'declaredTypes', file: 'declared-types', kind: 'type' },
  { key: 'declaredFunctions', file: 'declared-functions', kind: 'function' },
  { key: 'declaredClasses', file: 'declared-classes', kind: 'class' },
  { key: 'declaredInterfaces', file: 'declared-interfaces', kind: 'interface' },
  { key: 'declaredConstants', file: 'declared-constants', kind: 'constant' },
  { key: 'declaredVariables', file: 'declared-variables', kind: 'variable' },
]

export const collectOccurrences = (
  files: string[],
  repoRoot: string
): OccurrenceBucket[] => {
  const declarations = scanDeclarations(files)
  const declarationBuckets = DECLARATION_BUCKETS.map((b) => ({
    key: b.key,
    file: b.file,
    occurrences: enrich(
      declarations.filter((d) => d.kind === b.kind),
      repoRoot
    ),
  }))
  return [
    {
      key: 'errorDeclarations',
      file: 'error-declarations',
      occurrences: enrich(aggregateErrors(files), repoRoot),
    },
    {
      key: 'errorThrowStatements',
      file: 'error-throw-statements',
      occurrences: enrich(aggregateThrows(files), repoRoot),
    },
    {
      key: 'indexFiles',
      file: 'index-files',
      occurrences: enrich(scanIndexFiles(files), repoRoot),
    },
    {
      key: 'stringLiterals',
      file: 'string-literals',
      occurrences: enrich(scanStringLiterals(files), repoRoot),
    },
    {
      key: 'conditionalExpressions',
      file: 'conditional-expressions',
      occurrences: enrich(scanConditionalExpressions(files), repoRoot),
    },
    {
      key: 'fixtureFiles',
      file: 'fixture-files',
      occurrences: enrich(scanFixtureFiles(files), repoRoot),
    },
    ...declarationBuckets,
  ]
}
