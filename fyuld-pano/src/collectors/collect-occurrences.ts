import * as fs from 'fs'
import * as path from 'path'
import { Occurrence, NotApplicable } from '../datamodel'
import { FileFormat } from '@fyuld/ldm'
import { aggregateErrors, aggregateThrows } from '../assessments/errors'
import { collectClassConstructors } from '../assessments/class-constructors/class-constructors'
import { parseTypeScript } from '../languages/typescript'
import { scanIndexFiles } from '../assessments/index-files'
import { scanStringLiterals } from '../assessments/string-literals'
import { scanDeclarations } from '../assessments/duplicate-declarations'
import { scanConditionalExpressions } from '../assessments/conditional-expressions'
import { scanFixtureFiles } from '../assessments/fixture-files'
import { ScannedRow } from '../datamodel/entities/scanned-row'

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
  const sources = files
    .filter((file) => file.endsWith('.ts'))
    .map((file) => ({
      file,
      ast: parseTypeScript(fs.readFileSync(file, FileFormat.Utf8), file),
    }))
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
      key: 'classConstructors',
      file: 'class-constructors',
      occurrences: enrich(collectClassConstructors(sources), repoRoot),
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
