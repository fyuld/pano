import { FyuldError, StandardHttpStatusCode, Uri } from '@fyuld/ldm'

export class FindingError extends FyuldError {
  protected constructor(detail: string, format: string) {
    super(
      'fyuld:errors/finding' as Uri,
      'Finding Error',
      StandardHttpStatusCode.BadRequest,
      detail,
      `urn:fyuld:fn:writeFindings:${encodeURIComponent(format)}` as Uri
    )
  }

  static unknownFormat(format: string): FindingError {
    return new FindingError(`Unknown finding format: ${format}`, format)
  }
}
