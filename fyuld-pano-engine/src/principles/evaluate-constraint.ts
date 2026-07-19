import { JSONPath } from 'jsonpath-plus'

export const evaluateConstraint = (
  data: unknown,
  jsonPath: string
): unknown[] =>
  JSONPath({
    path: jsonPath,
    json: data as object,
    eval: 'native',
  }) as unknown[]
