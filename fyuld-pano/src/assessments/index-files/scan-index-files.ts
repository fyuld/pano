import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'
import { NotApplicable } from '../../datamodel'
import { FileFormat } from '@fyuld/ldm'
import { parseTypeScript } from '../../languages/typescript'
import { ScannedRow } from '../../datamodel/entities/scanned-row'

const hasExportModifier = (stmt: ts.Statement): boolean => {
  const mods = (stmt as { modifiers?: readonly ts.ModifierLike[] }).modifiers
  return mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false
}

const isDefinition = (stmt: ts.Statement): boolean =>
  ts.isClassDeclaration(stmt) ||
  ts.isFunctionDeclaration(stmt) ||
  ts.isInterfaceDeclaration(stmt) ||
  ts.isTypeAliasDeclaration(stmt) ||
  ts.isEnumDeclaration(stmt) ||
  ts.isVariableStatement(stmt)

const countStatements = (
  sourceFile: ts.SourceFile
): {
  imports: number
  reExports: number
  exports: number
  declarations: number
} => {
  let imports = 0
  let reExports = 0
  let exports = 0
  let declarations = 0
  for (const stmt of sourceFile.statements) {
    if (ts.isImportDeclaration(stmt)) imports++
    if (ts.isExportDeclaration(stmt)) reExports++
    if (hasExportModifier(stmt)) exports++
    if (isDefinition(stmt)) declarations++
  }
  return { imports, reExports, exports, declarations }
}

export const scanIndexFiles = (files: string[]): ScannedRow[] => {
  const occurrences: ScannedRow[] = []
  for (const file of files) {
    if (path.basename(file) !== 'index.ts') continue
    const source = fs.readFileSync(file, FileFormat.Utf8)
    const sourceFile = parseTypeScript(source, file)
    occurrences.push({
      file,
      line: NotApplicable,
      ...countStatements(sourceFile),
    })
  }
  return occurrences
}
