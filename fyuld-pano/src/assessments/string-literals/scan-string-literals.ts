import * as fs from 'fs'
import * as ts from 'typescript'
import { ScannedRow } from '../../datamodel/entities/scanned-row'
import { FileFormat } from '@fyuld/ldm'
import { parseTypeScript } from '../../languages/typescript'
import { parseTerraformStringLiterals } from '../../languages/terraform'

const TEST_AND_BDD_FUNCTIONS = new Set([
  'Given',
  'When',
  'Then',
  'And',
  'describe',
  'test',
])

const UTILITARY_PREDEFINED_EXCEPTIONS = new Set(['\n', '\\n', ''])

const isLiteral = (node: ts.Node): node is ts.StringLiteral =>
  ts.isStringLiteral(node)

const isTestOrBddFunction = (name: string): boolean => {
  const lower = name.toLowerCase()
  for (const fn of TEST_AND_BDD_FUNCTIONS) {
    if (fn.toLowerCase() === lower) return true
  }
  return false
}

const isPredefinedException = (value: string): boolean =>
  UTILITARY_PREDEFINED_EXCEPTIONS.has(value)

const isDuplicableStringLiteral = (node: ts.Node): node is ts.StringLiteral =>
  isLiteral(node) && !isPredefinedException(node.text)

const isDuplicableNamedDeclaration = (
  node: ts.Node
): node is (ts.VariableDeclaration | ts.ParameterDeclaration) & {
  name: ts.Identifier
  initializer: ts.StringLiteral
} =>
  (ts.isVariableDeclaration(node) || ts.isParameter(node)) &&
  ts.isIdentifier(node.name) &&
  node.initializer !== undefined &&
  isDuplicableStringLiteral(node.initializer)

const literalValue = (node: ts.StringLiteral): string => `'${node.text}'`

export const scanStringLiterals = (files: string[]): ScannedRow[] => {
  const occurrences: ScannedRow[] = []

  const JS_EXTENSIONS = new Set(['.ts', '.tsx', '.js'])

  for (const file of files) {
    const ext = file.slice(file.lastIndexOf('.'))
    const source = fs.readFileSync(file, FileFormat.Utf8)

    if (ext === '.tf') {
      for (const lit of parseTerraformStringLiterals(source)) {
        if (!isPredefinedException(lit.value)) {
          occurrences.push({
            value: `'${lit.value}'`,
            name: lit.name,
            type: 'string',
            length: lit.value.length,
            usage: 'variable',
            file,
            line: lit.line,
            code: lit.code,
          })
        }
      }
      continue
    }

    if (!JS_EXTENSIONS.has(ext)) continue

    const sourceFile = parseTypeScript(source, file)
    const lines = source.split('\n')

    const lineOf = (node: ts.Node): number =>
      sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line +
      1

    const codeAt = (line: number): string => (lines[line - 1] ?? '').trim()

    const visit = (node: ts.Node): void => {
      if (isDuplicableNamedDeclaration(node)) {
        const usage = ts.isParameter(node) ? 'default' : 'variable'
        const line = lineOf(node.initializer)
        occurrences.push({
          value: literalValue(node.initializer),
          name: node.name.text,
          type: 'string',
          length: node.initializer.text.length,
          usage,
          file,
          line,
          code: codeAt(line),
        })
      } else if (ts.isCallExpression(node)) {
        const callee = node.expression
        const name = ts.isPropertyAccessExpression(callee)
          ? callee.name.text
          : ts.isIdentifier(callee)
            ? callee.text
            : undefined
        const isScannableFunctionCall =
          name !== undefined && !isTestOrBddFunction(name)
        if (isScannableFunctionCall) {
          for (const arg of node.arguments) {
            if (isDuplicableStringLiteral(arg)) {
              const line = lineOf(arg)
              occurrences.push({
                value: literalValue(arg),
                name,
                type: 'string',
                length: arg.text.length,
                usage: 'function',
                file,
                line,
                code: codeAt(line),
              })
            }
          }
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
  }

  return occurrences
}
