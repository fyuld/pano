export type TerraformDeclaration = {
  name: string
  kind: string
  line: number
  code: string
}

export type TerraformStringLiteral = {
  value: string
  name: string
  line: number
  code: string
}

export const parseTerraformDeclarations = (
  source: string
): TerraformDeclaration[] => {
  const lines = source.split('\n')
  const results: TerraformDeclaration[] = []

  for (let i = 0; i < lines.length; i++) {
    const code = lines[i].trim()
    const lineNum = i + 1

    const resource = code.match(/^resource\s+"([^"]+)"\s+"([^"]+)"\s*\{/)
    if (resource) {
      results.push({
        name: `${resource[1]}.${resource[2]}`,
        kind: 'resource',
        line: lineNum,
        code,
      })
      continue
    }

    const data = code.match(/^data\s+"([^"]+)"\s+"([^"]+)"\s*\{/)
    if (data) {
      results.push({
        name: `${data[1]}.${data[2]}`,
        kind: 'data',
        line: lineNum,
        code,
      })
      continue
    }

    const named = code.match(
      /^(variable|output|module|provider)\s+"([^"]+)"\s*\{/
    )
    if (named) {
      results.push({ name: named[2], kind: named[1], line: lineNum, code })
      continue
    }

    const block = code.match(/^(locals|terraform)\s*\{/)
    if (block) {
      results.push({ name: block[1], kind: block[1], line: lineNum, code })
    }
  }

  return results
}

export const parseTerraformStringLiterals = (
  source: string
): TerraformStringLiteral[] => {
  const lines = source.split('\n')
  const results: TerraformStringLiteral[] = []

  for (let i = 0; i < lines.length; i++) {
    const code = lines[i].trim()
    const lineNum = i + 1

    const match = code.match(/^(\w+)\s*=\s*"([^"]*)"/)
    const isNonInterpolatedStringLiteral =
      match !== null && !match[2].includes('${')
    if (isNonInterpolatedStringLiteral) {
      results.push({ name: match[1], value: match[2], line: lineNum, code })
    }
  }

  return results
}
