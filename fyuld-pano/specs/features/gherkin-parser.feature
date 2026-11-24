Feature: Gherkin parser
  As a fpou developer
  I want to parse .feature files into a typed AST
  So that fitness functions can inspect them

  Scenario: parseFeature returns a GherkinDocument for the smoke feature
    Given the contents of "specs/features/smoke.feature"
    When parsed with parseFeature
    Then the document has a feature
    And the feature's name is "Test rails"
    And the feature has 3 scenarios

  Scenario: parseFeature exposes scenario step counts and tables
    Given the contents of "specs/features/smoke.feature"
    When parsed with parseFeature
    Then scenario 1 has 3 steps
    And scenario 2 has 8 steps
    And scenario 2 step 1 has a data table with 3 rows
