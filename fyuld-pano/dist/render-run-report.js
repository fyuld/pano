"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRunReport = void 0;
const mdad_1 = require("@fyuld/mdad");
const PRINCIPLE_REPORT_SCHEMA = {
    heading: { from: '#' },
    path: { from: '# / text()', optional: true },
    remarks: { from: '# / ## Remarks / items()', optional: true },
};
const PRINCIPLE_TASK_SCHEMA = {
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
        from: '# Scores / ## Per quality criteria / items()',
    },
    perPrinciple: {
        from: '# Scores / ## Per principle / items()',
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
const renderPrinciple = (verdict, detailed) => {
    const p = verdict.principle;
    if (verdict.violations.length === 0) {
        const clearJson = {
            heading: `Principle — ${p.name}: All Clean`,
        };
        if (verdict.mdFile)
            clearJson.path = verdict.mdFile;
        return (0, mdad_1.renderMarkdownWithSchema)(clearJson, PRINCIPLE_REPORT_SCHEMA).trimEnd();
    }
    const cost = p.preferences.points * verdict.violations.length;
    const threshold = p.preferences.threshold;
    const status = threshold !== undefined && cost <= threshold
        ? `Acceptable (${verdict.violations.length} Remarks)`
        : `${verdict.violations.length} Remarks`;
    const json = {
        heading: `Principle — ${p.name}: ${status}`,
    };
    if (detailed) {
        json.description = p.description;
        json.purpose = p.purpose;
        json.implementation = p.implementation;
        json.defaultAgentRecommendation = p.defaultAgentRecommendation;
    }
    else if (verdict.mdFile) {
        json.path = verdict.mdFile;
    }
    const remarks = verdict.violations.map(remarkLine);
    if (remarks.length > 0)
        json.remarks = remarks;
    return (0, mdad_1.renderMarkdownWithSchema)(json, detailed ? PRINCIPLE_TASK_SCHEMA : PRINCIPLE_REPORT_SCHEMA).trimEnd();
};
const renderScores = (categoryTotals, principleCosts, grandTotal) => {
    const json = {
        perQualityCriteria: [...categoryTotals].map(([qualityCriteria, points]) => `${qualityCriteria}: ${points}pt`),
        perPrinciple: [
            ...principleCosts.map(({ label, value }) => `${label}: ${value}pt`),
            `Total: ${grandTotal}pt`,
        ],
    };
    return (0, mdad_1.renderMarkdownWithSchema)(json, SCORES_SCHEMA).trimEnd();
};
const renderRunReport = (verdicts, detailed = false) => {
    const categoryTotals = new Map();
    const principleCosts = [];
    let grandTotal = 0;
    const blocks = [];
    for (const verdict of verdicts) {
        const p = verdict.principle;
        blocks.push(renderPrinciple(verdict, detailed));
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