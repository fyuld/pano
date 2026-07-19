import { renderMarkdownWithSchema, MdSchema } from '@fyuld/mdad'
import { JsonObject } from '@fyuld/ldm'
import { PrincipleVerdict, ViolationRow } from '@fyuld/pano-engine'

const PRINCIPLE_REPORT_SCHEMA: MdSchema = {
  heading: { from: '#' },
  path: { from: '# / text()', optional: true },
  remarks: { from: '# / ## Remarks / items()', optional: true },
}

const PRINCIPLE_TASK_SCHEMA: MdSchema = {
  heading: { from: '#' },
  description: { from: '# / ## Description / text()', optional: true },
  purpose: { from: '# / ## Purpose / text()' },
  implementation: { from: '# / ## Implementation / text()' },
  defaultAgentRecommendation: {
    from: '# / ## Default Agent Recommendation / text()',
    optional: true,
  },
  remarks: { from: '# / ## Remarks / items()', optional: true },
}

const SCORES_SCHEMA: MdSchema = {
  perQualityCriteria: {
    from: '# Scores / ## Per quality criteria / items()',
  },
  perPrinciple: {
    from: '# Scores / ## Per principle / items()',
  },
}

const remarkLine = (remark: ViolationRow): string => {
  const lineNum = typeof remark.line === 'number' ? remark.line : undefined
  const loc = `${remark.file ?? ''}${lineNum !== undefined ? `:${lineNum}` : ''}`
  const lineContent =
    typeof remark.lineContent === 'string' ? remark.lineContent : ''
  const raw =
    typeof remark.condition === 'string' ? remark.condition : lineContent
  const content = raw.replace(/\s+/g, ' ').trim()
  const id = `#${remark.remarkId}`
  return content ? `${id} \`${content}\` ${loc}` : `${id} ${loc}`
}

const renderPrinciple = (
  verdict: PrincipleVerdict,
  detailed: boolean
): string => {
  const p = verdict.principle
  if (verdict.violations.length === 0) {
    const clearJson: Record<string, unknown> = {
      heading: `Principle — ${p.name}: All Clean`,
    }
    if (verdict.mdFile) clearJson.path = verdict.mdFile
    return renderMarkdownWithSchema(
      clearJson as unknown as JsonObject,
      PRINCIPLE_REPORT_SCHEMA
    ).trimEnd()
  }
  const cost = p.preferences.points * verdict.violations.length
  const threshold = p.preferences.threshold
  const status =
    threshold !== undefined && cost <= threshold
      ? `Acceptable (${verdict.violations.length} Remarks)`
      : `${verdict.violations.length} Remarks`
  const json: Record<string, unknown> = {
    heading: `Principle — ${p.name}: ${status}`,
  }
  if (detailed) {
    json.description = p.description
    json.purpose = p.purpose
    json.implementation = p.implementation
    json.defaultAgentRecommendation = p.defaultAgentRecommendation
  } else if (verdict.mdFile) {
    json.path = verdict.mdFile
  }
  const remarks = verdict.violations.map(remarkLine)
  if (remarks.length > 0) json.remarks = remarks
  return renderMarkdownWithSchema(
    json as unknown as JsonObject,
    detailed ? PRINCIPLE_TASK_SCHEMA : PRINCIPLE_REPORT_SCHEMA
  ).trimEnd()
}

const renderScores = (
  categoryTotals: Map<string, number>,
  principleCosts: Array<{ label: string; value: number }>,
  grandTotal: number
): string => {
  const json = {
    perQualityCriteria: [...categoryTotals].map(
      ([qualityCriteria, points]) => `${qualityCriteria}: ${points}pt`
    ),
    perPrinciple: [
      ...principleCosts.map(({ label, value }) => `${label}: ${value}pt`),
      `Total: ${grandTotal}pt`,
    ],
  }
  return renderMarkdownWithSchema(
    json as unknown as JsonObject,
    SCORES_SCHEMA
  ).trimEnd()
}

export const renderRunReport = (
  verdicts: PrincipleVerdict[],
  detailed = false
): string => {
  const categoryTotals = new Map<string, number>()
  const principleCosts: Array<{ label: string; value: number }> = []
  let grandTotal = 0
  const blocks: string[] = []

  for (const verdict of verdicts) {
    const p = verdict.principle
    blocks.push(renderPrinciple(verdict, detailed))
    blocks.push('---')

    const occurrences = verdict.violations.length
    const cost = p.preferences.points * occurrences
    if (cost > 0) {
      for (const criterion of p.preferences.qualityCriteria ?? []) {
        categoryTotals.set(
          criterion,
          (categoryTotals.get(criterion) ?? 0) + cost
        )
      }
      principleCosts.push({ label: p.name, value: cost })
      grandTotal += cost
    }
  }

  if (principleCosts.length > 0) {
    blocks.push(renderScores(categoryTotals, principleCosts, grandTotal))
  }

  return blocks.join('\n\n') + '\n'
}
