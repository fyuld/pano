# Useful and Detailed Errors

## Preferences

- Points: 15
- Quality Criteria:
  - Readability

## Description

Errors should comply with RFC 7807 standard.

## Purpose

Errors should be informative, and contain enough information for engineering, security, and support to identify the issue and be able to address it.

## Implementation

For this project, use subclasses of `FyuldError` declared in `@fyuld/ldm`. It implements RFC 7807 and has guards to prevent instantiation.

When extending the `FyuldError` class make sure to keep constructor protected, to ensure that instantiation is only possible via designated factory functions.

### Constraints

- $.errorThrowStatements[?(!@.inheritancePath.includes('FyuldError'))]

### Default Agent Recommendation

None
