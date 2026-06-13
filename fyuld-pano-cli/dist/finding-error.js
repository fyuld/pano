"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindingError = void 0;
const ldm_1 = require("@fyuld/ldm");
class FindingError extends ldm_1.FyuldError {
    constructor(detail, format) {
        super('fyuld:errors/finding', 'Finding Error', ldm_1.StandardHttpStatusCode.BadRequest, detail, `urn:fyuld:fn:writeFindings:${encodeURIComponent(format)}`);
    }
    static unknownFormat(format) {
        return new FindingError(`Unknown finding format: ${format}`, format);
    }
}
exports.FindingError = FindingError;
//# sourceMappingURL=finding-error.js.map