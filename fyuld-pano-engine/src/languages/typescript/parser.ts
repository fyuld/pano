import * as ts from 'typescript'

const inferScriptKind = (fileName: string): ts.ScriptKind => {
  if (fileName.endsWith('.tsx')) return ts.ScriptKind.TSX
  if (fileName.endsWith('.jsx')) return ts.ScriptKind.JSX
  if (fileName.endsWith('.js')) return ts.ScriptKind.JS
  return ts.ScriptKind.TS
}

export const parseTypeScript = (
  source: string,
  fileName = 'input.ts'
): ts.SourceFile =>
  ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    inferScriptKind(fileName)
  )

export const getSyntacticErrors = (
  sourceFile: ts.SourceFile
): readonly ts.Diagnostic[] =>
  (sourceFile as unknown as { parseDiagnostics?: ts.Diagnostic[] })
    .parseDiagnostics ?? []

export const countCodeLines = (sourceFile: ts.SourceFile): number => {
  const lines = new Set<number>()
  const visit = (node: ts.Node): void => {
    if (node.kind === ts.SyntaxKind.EndOfFileToken) return
    let hasChild = false
    node.forEachChild(() => {
      hasChild = true
    })
    if (!hasChild) {
      const startPos = node.getStart(sourceFile)
      const startLine = sourceFile.getLineAndCharacterOfPosition(startPos).line
      const endLine = sourceFile.getLineAndCharacterOfPosition(node.end).line
      for (let l = startLine; l <= endLine; l++) lines.add(l)
    } else {
      node.forEachChild(visit)
    }
  }
  visit(sourceFile)
  return lines.size
}
