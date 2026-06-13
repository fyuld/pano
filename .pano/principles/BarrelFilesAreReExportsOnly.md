# Barrel Files Are Re-Exports Only

## Preferences

- Points: 10
- Quality Criteria:
  - Readability

## Description

index.ts files should contain only re-export statements, no logic.

## Purpose

Barrel files stay pure pass-throughs so imports do not pull in side effects or hide implementation.

## Implementation

Use only `export { ... } from '...'` or `export * from '...'` statements in index.ts files. Move any logic, local declarations, or direct imports to non-index source files.

### Constraints

- $.indexFiles[?(@.imports > 0 || @.declarations > 0 || @.exports > 0)]

### Default Agent Recommendation

None at the moment.
