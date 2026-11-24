Feature: Plain comment budget
  As a fpou developer
  I want a fitness function that fails when plain comments exceed budget
  So that low-value noise comments do not accumulate in the codebase

  Scenario: file with no plain comments passes
    Given the TypeScript source "foo.ts":
      """
      export const x = 1;
      """
    When the budget runs with maxAbsolute 100 and maxPercent 100
    Then the budget passes
    And the total plain count is 0
    And the total code lines is 1

  Scenario: plain singleline comment is counted
    Given the TypeScript source "foo.ts":
      """
      // plain note
      const x = 1;
      """
    When the budget runs with maxAbsolute 100 and maxPercent 100
    Then the total plain count is 1
    And the total code lines is 1

  Scenario: plain multiline comment is counted
    Given the TypeScript source "foo.ts":
      """
      /* block comment */
      const x = 1;
      """
    When the budget runs with maxAbsolute 100 and maxPercent 100
    Then the total plain count is 1
    And the total code lines is 1

  Scenario: tagged comments are not plain
    Given the TypeScript source "foo.ts":
      """
      // TODO: x
      // FIXME y
      // HACK z
      // eslint-disable-next-line
      // EXPLANATION: w
      const x = 1;
      """
    When the budget runs with maxAbsolute 100 and maxPercent 100
    Then the total plain count is 0

  Scenario: jsdoc is documentation not plain
    Given the TypeScript source "foo.ts":
      """
      /** doc */
      export const x = 1;
      """
    When the budget runs with maxAbsolute 100 and maxPercent 100
    Then the total plain count is 0

  Scenario: exceeds absolute threshold
    Given the TypeScript source "foo.ts":
      """
      // a
      // b
      // c
      const x = 1;
      """
    When the budget runs with maxAbsolute 2 and maxPercent 1000
    Then the budget fails
    And the violations include "absolute"

  Scenario: exceeds percentage threshold
    Given the TypeScript source "foo.ts":
      """
      // a
      const x = 1;
      """
    When the budget runs with maxAbsolute 100 and maxPercent 50
    Then the budget fails
    And the violations include "percent"
