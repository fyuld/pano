import * as fs from 'fs';
import { defineFeature, loadFeature } from 'jest-cucumber';
import type { GherkinDocument, Scenario } from '@cucumber/messages';
import { parseFeature } from '../../src/languages/gherkin';

const feature = loadFeature('specs/features/gherkin-parser.feature');

const scenariosOf = (doc: GherkinDocument | undefined): Scenario[] =>
  (doc?.feature?.children ?? [])
    .map((child) => child.scenario)
    .filter((scenario): scenario is Scenario => scenario !== undefined);

defineFeature(feature, (test) => {
  test('parseFeature returns a GherkinDocument for the smoke feature', ({
    given,
    when,
    then,
    and,
  }) => {
    let source = '';
    let doc: GherkinDocument | undefined;

    given(/^the contents of "(.*)"$/, (path: string) => {
      source = fs.readFileSync(path, 'utf-8');
    });

    when('parsed with parseFeature', () => {
      doc = parseFeature(source);
    });

    then('the document has a feature', () => {
      expect(doc?.feature).toBeDefined();
    });

    and(/^the feature's name is "(.*)"$/, (name: string) => {
      expect(doc?.feature?.name).toBe(name);
    });

    and(/^the feature has (\d+) scenarios$/, (count: string) => {
      expect(scenariosOf(doc).length).toBe(Number(count));
    });
  });

  test('parseFeature exposes scenario step counts and tables', ({ given, when, then, and }) => {
    let source = '';
    let doc: GherkinDocument | undefined;

    given(/^the contents of "(.*)"$/, (path: string) => {
      source = fs.readFileSync(path, 'utf-8');
    });

    when('parsed with parseFeature', () => {
      doc = parseFeature(source);
    });

    then(/^scenario (\d+) has (\d+) steps$/, (idx: string, count: string) => {
      const scenario = scenariosOf(doc)[Number(idx) - 1];
      expect(scenario?.steps.length).toBe(Number(count));
    });

    and(/^scenario (\d+) has (\d+) steps$/, (idx: string, count: string) => {
      const scenario = scenariosOf(doc)[Number(idx) - 1];
      expect(scenario?.steps.length).toBe(Number(count));
    });

    and(
      /^scenario (\d+) step (\d+) has a data table with (\d+) rows$/,
      (scenarioIdx: string, stepIdx: string, rowCount: string) => {
        const scenario = scenariosOf(doc)[Number(scenarioIdx) - 1];
        const step = scenario?.steps[Number(stepIdx) - 1];
        expect(step?.dataTable?.rows.length).toBe(Number(rowCount));
      },
    );
  });
});
