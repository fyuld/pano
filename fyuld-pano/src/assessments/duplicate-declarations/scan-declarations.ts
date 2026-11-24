import * as fs from 'fs'
import * as ts from 'typescript'
import { FileFormat } from '@fyuld/ldm'
import { ScannedRow } from '../scanned-row'
import { parseTypeScript } from '../../languages/typescript'
import { parseTerraformDeclarations } from '../../languages/terraform'

type DeclarationKind =
  | 'constant'
  | 'variable'
  | 'function'
  | 'class'
  | 'type'
  | 'interface'

const lineOf = (node: ts.Node, sourceFile: ts.SourceFile): number =>
  sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1

const codeAt = (line: number, lines: string[]): string =>
  (lines[line - 1] ?? '').trim()

const isAnonymousDeclaration = (
  declaration: ts.FunctionDeclaration | ts.ClassDeclaration
): boolean => declaration.name === undefined

export const scanDeclarations = (files: string[]): ScannedRow[] => {
  const occurrences: ScannedRow[] = []

  for (const file of files) {
    const source = fs.readFileSync(file, FileFormat.Utf8)

    if (file.endsWith('.tf')) {
      for (const decl of parseTerraformDeclarations(source)) {
        occurrences.push({
          name: decl.name,
          kind: decl.kind,
          file,
          line: decl.line,
          code: decl.code,
        })
      }
      continue
    }

    const sourceFile = parseTypeScript(source, file)
    const lines = source.split('\n')

    const push = (name: string, kind: DeclarationKind, node: ts.Node): void => {
      const line = lineOf(node, sourceFile)
      occurrences.push({ name, kind, file, line, code: codeAt(line, lines) })
    }

    for (const declaration of sourceFile.statements) {
      const isNamedFunctionDeclaration =
        ts.isFunctionDeclaration(declaration) &&
        !isAnonymousDeclaration(declaration)
      const isNamedClassDeclaration =
        ts.isClassDeclaration(declaration) &&
        !isAnonymousDeclaration(declaration)
      if (ts.isVariableStatement(declaration)) {
        const isConst =
          (declaration.declarationList.flags & ts.NodeFlags.Const) !== 0
        for (const decl of declaration.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            push(decl.name.text, isConst ? 'constant' : 'variable', decl)
          }
        }
      } else if (isNamedFunctionDeclaration) {
        push(declaration.name!.text, 'function', declaration)
      } else if (isNamedClassDeclaration) {
        push(declaration.name!.text, 'class', declaration)
      } else if (ts.isTypeAliasDeclaration(declaration)) {
        push(declaration.name.text, 'type', declaration)
      } else if (ts.isInterfaceDeclaration(declaration)) {
        push(declaration.name.text, 'interface', declaration)
      }
    }
  }

  return occurrences
}
