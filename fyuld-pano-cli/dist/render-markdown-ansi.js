"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMarkdownAsAnsi = void 0;
const format_1 = require("./format");
const BOX_INNER = Math.max(40, (process.stdout.columns ?? 80) - 4);
const fmtScoreRow = (label, value) => {
    const gap = Math.max(1, BOX_INNER - label.length - value.length);
    return `${label}${' '.repeat(gap)}${value}`;
};
const renderBox = (title, bodyLines, totalLine) => {
    const lines = [
        `┌─ ${title} ${'─'.repeat(Math.max(0, BOX_INNER - title.length - 1))}┐`,
        `│ ${' '.repeat(BOX_INNER)} │`,
        ...bodyLines.map((l) => `│ ${l.padEnd(BOX_INNER)} │`),
    ];
    if (totalLine !== undefined) {
        lines.push(`│ ${'─'.repeat(BOX_INNER)} │`);
        lines.push(`│ ${totalLine.padEnd(BOX_INNER)} │`);
    }
    lines.push(`└${'─'.repeat(BOX_INNER + 2)}┘`);
    for (const line of lines)
        console.log(line);
};
const stripBold = (s) => s.replace(/\*\*/g, '');
const renderMarkdownAsAnsi = (md) => {
    const lines = md.split('\n');
    let i = 0;
    let firstPrinciple = true;
    while (i < lines.length) {
        const line = lines[i];
        if (line === '# Scores') {
            i++;
            continue;
        }
        if (line.startsWith('# Principle — ')) {
            if (!firstPrinciple)
                console.log('');
            firstPrinciple = false;
            const name = line.slice('# Principle — '.length);
            console.log(`Principle — ${name}:`);
            i++;
            continue;
        }
        if (line.startsWith('### ')) {
            const title = line.slice('### '.length);
            i++; // column header row
            i++; // |---|---| separator
            const rows = [];
            while (i < lines.length && lines[i].startsWith('|')) {
                const cells = lines[i]
                    .split('|')
                    .filter((c) => c.trim())
                    .map((c) => stripBold(c.trim()));
                const isTableDataRow = cells.length >= 2 && !cells[0].startsWith('-');
                if (isTableDataRow) {
                    rows.push({ label: cells[0], value: cells[1] });
                }
                i++;
            }
            if (rows.length > 0) {
                console.log('');
                const lastRow = rows[rows.length - 1];
                const hasTotal = lastRow.label.toLowerCase() === 'total';
                const bodyRows = hasTotal ? rows.slice(0, -1) : rows;
                const totalRow = hasTotal ? lastRow : undefined;
                renderBox(title, bodyRows.map((r) => fmtScoreRow(r.label, r.value)), totalRow ? fmtScoreRow(totalRow.label, totalRow.value) : undefined);
            }
            continue;
        }
        const isBoldKeyValueLine = line.startsWith('**') && line.includes(':**');
        if (isBoldKeyValueLine) {
            const colonIdx = line.indexOf(':**');
            const key = line.slice(2, colonIdx);
            const value = line.slice(colonIdx + 3).trim();
            console.log('');
            console.log(`  ${(0, format_1.styled)('1', key + ':')}`);
            console.log(`  ${value}`);
            i++;
            continue;
        }
        if (line === '**Remarks:**') {
            console.log('');
            console.log(`  ${(0, format_1.styled)('1', 'Remarks:')}`);
            i++;
            continue;
        }
        if (line.startsWith('- ')) {
            const text = line.slice(2);
            const idMatch = text.match(/^(#\d+) (.*)$/);
            const id = idMatch ? idMatch[1] : '';
            const rest = idMatch ? idMatch[2] : text;
            const lastSpace = rest.lastIndexOf(' ');
            const hasCode = rest.startsWith('`');
            const code = hasCode ? rest.slice(1, lastSpace - 1) : '';
            const loc = hasCode ? rest.slice(lastSpace + 1) : rest;
            const dimLoc = (0, format_1.styled)('90', loc);
            const boldId = id ? (0, format_1.styled)('1', id) + '  ' : '';
            console.log(hasCode ? `    ${boldId}${code}  ${dimLoc}` : `    ${boldId}${dimLoc}`);
            i++;
            continue;
        }
        const isHorizontalRuleOrBlankLine = line === '---' || line === '';
        if (isHorizontalRuleOrBlankLine) {
            i++;
            continue;
        }
        if (line.trim()) {
            console.log(`  ${line}`);
        }
        i++;
    }
};
exports.renderMarkdownAsAnsi = renderMarkdownAsAnsi;
//# sourceMappingURL=render-markdown-ansi.js.map