import * as fs from 'fs'
import * as ts from 'typescript'
import { FileFormat } from '@fyuld/ldm'
import { parseTypeScript } from '../../languages/typescript'
import { ScannedRow } from '../scanned-row'

const isLogicalBinaryExpression = (
  node: ts.Expression
): node is ts.BinaryExpression =>
  ts.isBinaryExpression(node) &&
  (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
    node.operatorToken.kind === ts.SyntaxKind.BarBarToken)

const countTerms = (node: ts.Expression): number => {
  if (ts.isParenthesizedExpression(node)) {
    return countTerms(node.expression)
  } else if (isLogicalBinaryExpression(node)) {
    return countTerms(node.left) + countTerms(node.right)
  } else {
    return 1
  }
}

export const scanConditionalExpressions = (files: string[]): ScannedRow[] => {
  const occurrences: ScannedRow[] = []

  for (const file of files) {
    if (!file.endsWith('.ts')) continue
    const source = fs.readFileSync(file, FileFormat.Utf8)
    const sourceFile = parseTypeScript(source, file)
    const lines = source.split('\n')

    const lineOf = (node: ts.Node): number =>
      sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line +
      1

    const codeAt = (line: number): string => (lines[line - 1] ?? '').trim()

    const push = (
      kind: string,
      node: ts.Node,
      condition: ts.Expression
    ): void => {
      const line = lineOf(node)
      occurrences.push({
        kind,
        condition: condition.getText(sourceFile),
        numTerms: countTerms(condition),
        file,
        line,
        code: codeAt(line),
      })
    }

    const visit = (node: ts.Node): void => {
      if (ts.isIfStatement(node)) {
        push('if', node, node.expression)
      } else if (ts.isSwitchStatement(node)) {
        push('switch', node, node.expression)
      } else if (ts.isConditionalExpression(node)) {
        push('ternary', node, node.condition)
      }
      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
  }

  return occurrences
}
