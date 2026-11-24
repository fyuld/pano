import { Finding } from '../datamodel'

export const renderJson = (rows: Finding[]): string =>
  JSON.stringify(rows, null, 2) + '\n'
