"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBddStepsForUx = generateBddStepsForUx;
function generateBddStepsForUx(featureContent) {
    const steps = [];
    const seen = new Set();
    let lastKind = "Given";
    for (const rawLine of featureContent.split("\n")) {
        const line = rawLine.trim();
        const match = line.match(/^(Given|When|Then|And|But)\s+(.+)$/);
        if (!match)
            continue;
        const keyword = match[1];
        const text = match[2].trim();
        const isGherkinStepKeyword = keyword === "Given" || keyword === "When" || keyword === "Then";
        const kind = isGherkinStepKeyword ? keyword : lastKind;
        if (isGherkinStepKeyword) {
            lastKind = keyword;
        }
        const dedupeKey = `${kind}|${text}`;
        if (seen.has(dedupeKey))
            continue;
        seen.add(dedupeKey);
        steps.push({ kind, text });
    }
    const header = `import { createBdd } from 'playwright-bdd'
import { test } from '@playwright/test'

const { Given, When, Then } = createBdd(test)

`;
    const body = steps
        .map((s) => `${s.kind}(\`${s.text.replace(/`/g, "\\`")}\`, async ({ page }) => {
  throw new Error('Not implemented')
})
`)
        .join("\n");
    return header + body;
}
//# sourceMappingURL=generate-bdd-steps-for-ux.js.map