import type { GherkinDocument } from '@cucumber/messages'
import { PanoError } from '@fyuld/pano-dm'

export const parseFeature = (source: string): GherkinDocument => {
  let gherkin: typeof import('@cucumber/gherkin')
  let messages: typeof import('@cucumber/messages')
  try {
    gherkin = require('@cucumber/gherkin')
    messages = require('@cucumber/messages')
  } catch {
    throw PanoError.missingDependency('@cucumber/gherkin @cucumber/messages')
  }

  const parser = new gherkin.Parser(
    new gherkin.AstBuilder(messages.IdGenerator.uuid()),
    new gherkin.GherkinClassicTokenMatcher()
  )
  return parser.parse(source)
}
