"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigError = void 0;
const ldm_1 = require("@fyuld/ldm");
class ConfigError extends ldm_1.FyuldError {
    constructor(detail, startDir) {
        super('fyuld:errors/config', 'Config Error', ldm_1.StandardHttpStatusCode.NotFound, detail, `urn:fyuld:fn:findConfig:${encodeURIComponent(startDir)}`);
    }
    static notFound(filename, startDir) {
        return new ConfigError(`${filename} not found in ${startDir} or any parent directory`, startDir);
    }
}
exports.ConfigError = ConfigError;
//# sourceMappingURL=config-error.js.map