"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateThrows = void 0;
const errors_1 = require("./errors");
const aggregateThrows = (files) => (0, errors_1.collectErrorEntries)(files).flatMap((entry) => entry.thrownAt.map((at) => ({
    label: entry.name,
    file: at.file,
    line: at.line,
    instantiation: at.instantiation,
    inheritancePath: entry.inheritancePath,
})));
exports.aggregateThrows = aggregateThrows;
//# sourceMappingURL=aggregateThrows.js.map