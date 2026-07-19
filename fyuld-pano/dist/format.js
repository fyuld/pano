"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperDuper = exports.styled = exports.setPretty = void 0;
let usePretty = true;
const setPretty = (b) => {
    usePretty = b;
};
exports.setPretty = setPretty;
const styled = (codes, text) => usePretty ? `\x1b[${codes}m${text}\x1b[0m` : text;
exports.styled = styled;
exports.SuperDuper = 1;
//# sourceMappingURL=format.js.map