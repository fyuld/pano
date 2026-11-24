import * as fs from 'fs'
import * as path from 'path'
import { ingestMarkdownWithSchema, MdSchema } from '@fyuld/mdad'
import { Principle } from '../datamodel'
import { FileFormat } from '@fyuld/ldm'

const principleSchema = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', '..', 'schemas', 'principle.mdschema.json'),
    FileFormat.Utf8
  )
) as MdSchema

export const compilePrinciple = (md: string): Principle =>
  ingestMarkdownWithSchema(md, principleSchema) as unknown as Principle
