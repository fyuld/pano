import { defineFeature, loadFeature } from 'jest-cucumber';
import { toPascalCasedTable, toPascalCasedTableRow } from '@fyuld/jest-cucumber-utils';

const feature = loadFeature('specs/features/smoke.feature');

defineFeature(feature, (test) => {
  test('jest-cucumber executes a feature', ({ given, when, then }) => {
    let harnessLoaded = false;
    let scenarioRan = false;

    given('the test harness is loaded', () => {
      harnessLoaded = true;
    });

    when('a scenario runs', () => {
      expect(harnessLoaded).toBe(true);
      scenarioRan = true;
    });

    then('the scenario passes', () => {
      expect(scenarioRan).toBe(true);
    });
  });

  test('@fyuld/jest-cucumber-utils parses a data table', ({ given, when, then, and }) => {
    let rawTable: Array<Record<string, string>> = [];
    let parsedTable: Array<Record<string, unknown>> = [];

    const expectString = (rowIdx: string, key: string, value: string) => {
      expect(parsedTable[Number(rowIdx)]?.[key]).toBe(value);
    };
    const expectBool = (rowIdx: string, key: string, value: string) => {
      expect(parsedTable[Number(rowIdx)]?.[key]).toBe(value === 'true');
    };
    const expectNumber = (rowIdx: string, key: string, value: string) => {
      expect(parsedTable[Number(rowIdx)]?.[key]).toBe(parseFloat(value));
    };

    const stringRe = /^the parsed row (\d+) has key "(.*)" with value "(.*)"$/;
    const boolRe = /^the parsed row (\d+) has key "(.*)" with value (true|false)$/;
    const numRe = /^the parsed row (\d+) has key "(.*)" with value (\d+(?:\.\d+)?)$/;

    given('the following capabilities:', (table: Array<Record<string, string>>) => {
      rawTable = table;
    });

    when('the table is converted with toPascalCasedTable', () => {
      parsedTable = toPascalCasedTable(rawTable);
    });

    // Row 0 — three asserts (string, bool, number).
    then(stringRe, expectString);
    and(boolRe, expectBool);
    and(numRe, expectNumber);

    // Row 1 — same three asserts; jest-cucumber needs one handler per feature step line.
    and(stringRe, expectString);
    and(boolRe, expectBool);
    and(numRe, expectNumber);
  });

  test('toPascalCasedTableRow converts header "<rawHeader>" into key "<expectedKey>"', ({
    given,
    when,
    then,
  }) => {
    let rawRow: Record<string, string> = {};
    let convertedRow: Record<string, unknown> = {};

    given(
      /^a single-row table with header "(.*)" and value "(.*)"$/,
      (header: string, value: string) => {
        rawRow = { [header]: value };
      },
    );

    when('the row is converted with toPascalCasedTableRow', () => {
      convertedRow = toPascalCasedTableRow(rawRow);
    });

    then(
      /^the converted row has key "(.*)" with string value "(.*)"$/,
      (key: string, value: string) => {
        expect(convertedRow[key]).toBe(value);
      },
    );
  });
});
