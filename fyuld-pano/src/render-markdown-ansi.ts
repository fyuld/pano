import { styled } from './format'

const NOIR_ON_COTTON = '30;48;2;245;245;240' // black text, cotton background

const HEADING_STYLES: Record<number, string> = {
  1: `${NOIR_ON_COTTON};1;4`, // #   → bold + underline
  2: `${NOIR_ON_COTTON};1`, //   ##  → bold
  3: `${NOIR_ON_COTTON};2`, //   ### → dim
}

const headingToAnsi = (line: string): string | undefined => {
  const match = line.match(/^(#+) (.+)$/)
  if (!match) return undefined
  const level = match[1].length
  return `  ${styled(HEADING_STYLES[level] ?? NOIR_ON_COTTON, ` ${match[2]} `)}`
}

export const renderMarkdownAsAnsi = (md: string): void => {
  const lines = md.split('\n')
  let i = 0
  let firstPrinciple = true

  while (i < lines.length) {
    const line = lines[i]

    if (line === '# Scores') {
      i++
      continue
    }

    if (line.startsWith('# Principle — ')) {
      if (!firstPrinciple) console.log('')
      firstPrinciple = false
      const rest = line.slice('# Principle — '.length)
      const isAllClean = rest.endsWith(': All Clean')
      const statusSeparator = rest.lastIndexOf(': ')
      const name = rest.slice(0, statusSeparator)
      const status = rest.slice(statusSeparator + 2)
      const badge = isAllClean
        ? styled('30;42', `  ${status}  `)
        : styled('30;48;2;255;102;0', `  ${status}  `)
      console.log(`${badge}  Principle: ${name}`)
      i++
      continue
    }

    const heading = headingToAnsi(line)
    if (heading !== undefined) {
      console.log('')
      console.log(heading)
      i++
      continue
    }

    const isBoldKeyValueLine = line.startsWith('**') && line.includes(':**')
    if (isBoldKeyValueLine) {
      const colonIdx = line.indexOf(':**')
      const key = line.slice(2, colonIdx)
      const value = line.slice(colonIdx + 3).trim()
      console.log('')
      console.log(`  ${styled('1', key + ':')}`)
      console.log(`  ${value}`)
      i++
      continue
    }

    if (line === '**Remarks:**') {
      console.log('')
      console.log(`  ${styled('1', 'Remarks:')}`)
      i++
      continue
    }

    if (line.startsWith('- ')) {
      const text = line.slice(2)
      const idMatch = text.match(/^(#\d+) (.*)$/)
      if (!idMatch) {
        console.log(`  - ${text}`)
        i++
        continue
      }
      const id = idMatch[1]
      const rest = idMatch[2]
      const lastSpace = rest.lastIndexOf(' ')
      const hasCode = rest.startsWith('`')
      const code = hasCode ? rest.slice(1, lastSpace - 1) : ''
      const loc = hasCode ? rest.slice(lastSpace + 1) : rest
      const dimLoc = styled('90', loc)
      const boldId = styled('1', id) + '  '
      console.log(
        hasCode ? `    ${boldId}${code}  ${dimLoc}` : `    ${boldId}${dimLoc}`
      )
      i++
      continue
    }

    const isHorizontalRuleOrBlankLine = line === '---' || line === ''
    if (isHorizontalRuleOrBlankLine) {
      i++
      continue
    }

    if (line.trim()) {
      console.log(`  ${line}`)
    }

    i++
  }
}
