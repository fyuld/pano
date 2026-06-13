import {
  AstBuilder,
  GherkinClassicTokenMatcher,
  Parser,
} from '@cucumber/gherkin'
import { GherkinDocument, IdGenerator } from '@cucumber/messages'

export const parseFeature = (source: string): GherkinDocument => {
  const parser = new Parser(
    new AstBuilder(IdGenerator.uuid()),
    new GherkinClassicTokenMatcher()
  )
  return parser.parse(source)
}
