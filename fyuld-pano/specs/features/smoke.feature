Feature: Test rails
  As a contributor to fpou
  I want a working jest-cucumber harness
  So that I can describe fpou's behavior in Gherkin and have it executed automatically

  Scenario: jest-cucumber executes a feature
    Given the test harness is loaded
    When a scenario runs
    Then the scenario passes

  Scenario: @fyuld/jest-cucumber-utils parses a data table
    Given the following capabilities:
      | Test Identifier | Is Enable | Current Priority |
      | smoke test   | true    | 1        |
      | fog test | false | 1 |
    When the table is converted with toPascalCasedTable
    Then the parsed row 0 has key "testIdentifier" with value "smoke test"
    And the parsed row 0 has key "isEnable" with value true
    And the parsed row 0 has key "currentPriority" with value 1
    And the parsed row 1 has key "testIdentifier" with value "fog test"
    And the parsed row 1 has key "isEnable" with value false
    And the parsed row 1 has key "currentPriority" with value 1

  Scenario Outline: toPascalCasedTableRow converts header "<rawHeader>" into key "<expectedKey>"
    Given a single-row table with header "<rawHeader>" and value "stub"
    When the row is converted with toPascalCasedTableRow
    Then the converted row has key "<expectedKey>" with string value "stub"

    Examples:
      | rawHeader        | expectedKey     |
      | Test Identifier  | testIdentifier  |
      | Is Enable        | isEnable        |
      | Current Priority | currentPriority |
