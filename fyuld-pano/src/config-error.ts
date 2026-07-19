import { FyuldError, StandardHttpStatusCode, Uri } from '@fyuld/ldm'

export class ConfigError extends FyuldError {
  protected constructor(detail: string, startDir: string) {
    super(
      'fyuld:errors/config' as Uri,
      'Config Error',
      StandardHttpStatusCode.NotFound,
      detail,
      `urn:fyuld:fn:findConfig:${encodeURIComponent(startDir)}` as Uri
    )
  }

  static notFound(filename: string, startDir: string): ConfigError {
    return new ConfigError(
      `${filename} not found in ${startDir} or any parent directory`,
      startDir
    )
  }
}
