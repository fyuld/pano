import { Uri } from '@fyuld/ldm'

export enum ErrorUriPrefix {
  PanoDependency = 'urn:fyuld:pano:dep:',
}

export const createErrorUrn = (
  prefix: ErrorUriPrefix,
  body: string
): Uri => {
  return `${prefix}:${body}` as Uri
}
