"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRunReport = void 0;
const mdad_1 = require("@fyuld/mdad");
const PRINCIPLE_SCHEMA = {
    heading: { from: '#' },
    description: { from: '# / ## Description / text()', optional: true },
    purpose: { from: '# / ## Purpose / text()' },
    implementation: { from: '# / ## Implementation / text()' },
    defaultAgentRecommendation: {
        from: '# / ## Default Agent Recommendation / text()',
        optional: true,
    },
    remarks: { from: '# / ## Remarks / items()', optional: true },
};
const SCORES_SCHEMA = {
    perQualityCriteria: {
        from: '# Scores / ## Per quality criteria / table(lowerCamelCase)',
        columns: { points: { type: 'number' } },
    },
    perPrinciple: {
        from: '# Scores / ## Per principle / table(lowerCamelCase)',
        columns: { points: { type: 'number' } },
    },
};
const remarkLine = (remark) => {
    const lineNum = typeof remark.line === 'number' ? remark.line : undefined;
    const loc = `${remark.file ?? ''}${lineNum !== undefined ? `:${lineNum}` : ''}`;
    const lineContent = typeof remark.lineContent === 'string' ? remark.lineContent : '';
    const raw = typeof remark.condition === 'string' ? remark.condition : lineContent;
    const content = raw.replace(/\s+/g, ' ').trim();
    const id = `#${remark.remarkId}`;
    return content ? `${id} \`${content}\` ${loc}` : `${id} ${loc}`;
};
const renderPrinciple = (verdict) => {
    const p = verdict.principle;
    if (verdict.violations.length === 0) {
        const clearJson = {
            heading: `Principle — ${p.name}: Clear`,
        };
        if (verdict.mdFile)
            clearJson.path = verdict.mdFile;
        return (0, mdad_1.renderMarkdownWithSchema)(clearJson, {
            heading: { from: '#' },
            path: { from: '# / text()', optional: true },
        }).trimEnd();
    }
    const json = {
        heading: `Principle — ${p.name}`,
        description: p.description,
        purpose: p.purpose,
        implementation: p.implementation,
        defaultAgentRecommendation: p.defaultAgentRecommendation,
    };
    const remarks = verdict.violations.map(remarkLine);
    if (remarks.length > 0)
        json.remarks = remarks;
    return (0, mdad_1.renderMarkdownWithSchema)(json, PRINCIPLE_SCHEMA).trimEnd();
};
const renderScores = (categoryTotals, principleCosts, grandTotal) => {
    const json = {
        perQualityCriteria: [...categoryTotals].map(([qualityCriteria, points]) => ({
            qualityCriteria,
            points,
        })),
        perPrinciple: [
            ...principleCosts.map(({ label, value }) => ({
                principle: label,
                points: value,
            })),
            { principle: '**Total**', points: grandTotal },
        ],
    };
    return (0, mdad_1.renderMarkdownWithSchema)(json, SCORES_SCHEMA).trimEnd();
};
const renderRunReport = (verdicts) => {
    const categoryTotals = new Map();
    const principleCosts = [];
    let grandTotal = 0;
    const blocks = [];
    for (const verdict of verdicts) {
        const p = verdict.principle;
        blocks.push(renderPrinciple(verdict));
        blocks.push('---');
        const occurrences = verdict.violations.length;
        const cost = p.preferences.points * occurrences;
        if (cost > 0) {
            for (const criterion of p.preferences.qualityCriteria ?? []) {
                categoryTotals.set(criterion, (categoryTotals.get(criterion) ?? 0) + cost);
            }
            principleCosts.push({ label: p.name, value: cost });
            grandTotal += cost;
        }
    }
    if (principleCosts.length > 0) {
        blocks.push(renderScores(categoryTotals, principleCosts, grandTotal));
    }
    return blocks.join('\n\n') + '\n';
};
exports.renderRunReport = renderRunReport;
//# sourceMappingURL=render-run-report.js.map