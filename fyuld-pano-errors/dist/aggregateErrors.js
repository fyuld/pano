"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateErrors = void 0;
const errors_1 = require("./errors");
const aggregateErrors = (files) => (0, errors_1.collectErrorEntries)(files)
    .filter((entry) => entry.declaredAt)
    .map((entry) => ({
    label: entry.name,
    file: entry.declaredAt.file,
    line: entry.declaredAt.line,
    reasons: entry.reasons,
    inheritancePath: entry.inheritancePath,
}));
exports.aggregateErrors = aggregateErrors;
//# sourceMappingURL=aggregateErrors.js.map