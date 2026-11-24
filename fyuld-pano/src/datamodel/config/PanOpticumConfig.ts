import { PlainTextFileFormats } from '@fyuld/ldm'

export type ObservedDirectories = {
  sourceCode: string[]
  testCode: string[]
}

export type PanOpticumConfig = {
  assessmentFormats: PlainTextFileFormats[]
  observedDirectories?: ObservedDirectories
  criteria?: string[]
}
