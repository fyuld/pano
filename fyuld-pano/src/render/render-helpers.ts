import { Finding } from '../datamodel'
import { isNotDefined } from '@fyuld/ldm'

export const cell = (value: unknown): string => {
  if (Array.isArray(value)) return value.join(';')
  if (isNotDefined(value)) return ''
  return String(value)
}

export const columns = (rows: Finding[]): string[] => {
  const keys: string[] = []
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!keys.includes(key)) keys.push(key)
    }
  }
  return keys
}
