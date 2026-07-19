import { Finding } from '@fyuld/pano-dm'

export const renderJson = (rows: Finding[]): string =>
  JSON.stringify(rows, null, 2) + '\n'
