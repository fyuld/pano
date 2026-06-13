# Avoid Redeclaring Same String Literals

## Preferences

- Points: 1
- Quality Criteria:
  - Readability

## Description

String literals used in more than one place should be extracted into named constants.

## Purpose

Repeated string values scatter intent across the codebase and make renaming error-prone.

## Implementation

Extract any string literal that appears more than once into a named constant in a shared module.

Alternatively suggest to user that they might be extracted to datamodel, config, or other place.

### Constraints

- $.duplicateStringLiterals[?(@.length > 3)]

### Default Agent Recommendation

None at the moment.