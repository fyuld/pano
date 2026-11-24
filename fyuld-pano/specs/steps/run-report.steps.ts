import { defineFeature, loadFeature } from 'jest-cucumber';
import { renderRunReport } from '../../src/cli/render-run-report';
import { PrincipleVerdict } from '../../src/principles/run-principles';
import { ViolationRow } from '../../src/principles/violation-to-be-renamed-to-remark';

const feature = loadFeature('specs/features/run-report.feature');

const remarkAt = (remarkId: number): ViolationRow =>
  ({
    remarkId,
    file: 'src/example.ts',
    line: 1,
    condition: 'a && b',
  }) as unknown as ViolationRow;

defineFeature(feature, (test) => {
  let verdict: PrincipleVerdict;
  let report = '';

  type GivenStep = (pattern: RegExp, fn: (...args: string[]) => void) => void;

  const givenPrinciple = (given: GivenStep) => {
    given(
      /^a principle "(.*)" described as "(.*)"$/,
      (name: string, description: string) => {
        verdict = {
          principle: {
            name,
            description,
            preferences: { points: 20 },
            purpose: 'purpose',
            implementation: 'implementation',
            constraints: [],
          },
          violations: [],
        };
      },
    );
  };

  test('a principle with remarks shows its description before its path', ({
    given,
    and,
    when,
    then,
  }) => {
    givenPrinciple(given);

    and(/^the principle lives at "(.*)"$/, (mdFile: string) => {
      verdict.mdFile = mdFile;
    });

    and(/^the principle has (\d+) remarks?$/, (count: string) => {
      verdict.violations = Array.from({ length: Number(count) }, (_, i) => remarkAt(i + 1));
    });

    when('the run report is rendered', () => {
      report = renderRunReport([verdict]);
    });

    then(/^the report contains "(.*)"$/, (text: string) => {
      expect(report).toContain(text);
    });

    and('the description appears after the heading', () => {
      const heading = report.indexOf('# Principle');
      const description = report.indexOf(verdict.principle.description!);
      expect(description).toBeGreaterThan(heading);
    });

    and('the path appears after the description', () => {
      const description = report.indexOf(verdict.principle.description!);
      const path = report.indexOf(verdict.mdFile!);
      expect(path).toBeGreaterThan(description);
    });
  });

  test('an all-clean principle shows only its path', ({ given, and, when, then }) => {
    givenPrinciple(given);

    and(/^the principle lives at "(.*)"$/, (mdFile: string) => {
      verdict.mdFile = mdFile;
    });

    and(/^the principle has (\d+) remarks?$/, (count: string) => {
      verdict.violations = Array.from({ length: Number(count) }, (_, i) => remarkAt(i + 1));
    });

    when('the run report is rendered', () => {
      report = renderRunReport([verdict]);
    });

    then(/^the report contains "(.*)"$/, (text: string) => {
      expect(report).toContain(text);
    });

    and('the report does not contain the description', () => {
      expect(report).not.toContain(verdict.principle.description!);
    });

    and('the path appears after the heading', () => {
      const heading = report.indexOf('# Principle');
      const path = report.indexOf(verdict.mdFile!);
      expect(path).toBeGreaterThan(heading);
    });
  });
});
