import * as ts from 'typescript'

export type Comment = {
  kind: 'SingleLine' | 'MultiLine'
  text: string
  pos: number
  end: number
  hasTrailingNewLine: boolean
}

const fromRange = (range: ts.CommentRange, sourceText: string): Comment => ({
  kind:
    range.kind === ts.SyntaxKind.SingleLineCommentTrivia
      ? 'SingleLine'
      : 'MultiLine',
  text: sourceText.slice(range.pos, range.end),
  pos: range.pos,
  end: range.end,
  hasTrailingNewLine: range.hasTrailingNewLine ?? false,
})

export const getLeadingComments = (
  node: ts.Node,
  sourceFile: ts.SourceFile
): Comment[] => {
  const ranges = ts.getLeadingCommentRanges(sourceFile.text, node.pos)
  return ranges ? ranges.map((r) => fromRange(r, sourceFile.text)) : []
}

export const getTrailingComments = (
  node: ts.Node,
  sourceFile: ts.SourceFile
): Comment[] => {
  const ranges = ts.getTrailingCommentRanges(sourceFile.text, node.end)
  return ranges ? ranges.map((r) => fromRange(r, sourceFile.text)) : []
}

export const getAllComments = (sourceFile: ts.SourceFile): Comment[] => {
  const seen = new Set<number>()
  const all: Comment[] = []
  const collect = (comments: Comment[]) => {
    for (const c of comments) {
      if (!seen.has(c.pos)) {
        seen.add(c.pos)
        all.push(c)
      }
    }
  }
  const visit = (node: ts.Node) => {
    collect(getLeadingComments(node, sourceFile))
    collect(getTrailingComments(node, sourceFile))
    node.forEachChild(visit)
  }
  visit(sourceFile)
  return all.sort((a, b) => a.pos - b.pos)
}
