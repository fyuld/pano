Feature: Run report
  As a pano user
  I want the run report to explain each principle that has remarks
  So that I understand what was violated without opening the principle file

  Scenario: a principle with remarks shows its description before its path
    Given a principle "Clear Conditional Purpose" described as "Conditional expressions should be clear to follow."
    And the principle lives at ".pano/principles/ClearConditionalPurpose.md"
    And the principle has 1 remark
    When the run report is rendered
    Then the report contains "# Principle — Clear Conditional Purpose: 1 Remarks"
    And the description appears after the heading
    And the path appears after the description

  Scenario: an all-clean principle shows only its path
    Given a principle "Clear Conditional Purpose" described as "Conditional expressions should be clear to follow."
    And the principle lives at ".pano/principles/ClearConditionalPurpose.md"
    And the principle has 0 remarks
    When the run report is rendered
    Then the report contains "# Principle — Clear Conditional Purpose: All Clean"
    And the report does not contain the description
    And the path appears after the heading
