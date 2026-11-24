import { FyuldError, StandardHttpStatusCode, Uri } from '@fyuld/ldm'
import { createErrorUrn, ErrorUriPrefix } from './urns'

export class PanoError extends FyuldError {
  protected constructor(detail: string, dependency: string) {
    super(
      'fyuld:errors/pano/missing-dependency' as Uri,
      'Missing Dependency',
      StandardHttpStatusCode.FailedDependency,
      detail,
      createErrorUrn(ErrorUriPrefix.PanoDependency, dependency)
    )
  }

  static missingDependency(dependency: string): PanoError {
    return new PanoError(`please install ${dependency}`, dependency)
  }
}
