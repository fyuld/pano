"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.principlesVerify = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const compile_principle_1 = require("./compile-principle");
const ldm_1 = require("@fyuld/ldm");
const pano_dm_1 = require("@fyuld/pano-dm");
const principlesVerify = (principlesDir) => {
    const results = [];
    for (const file of fs.readdirSync(principlesDir)) {
        if (!file.endsWith(pano_dm_1.FileExtension.Md))
            continue;
        const md = fs.readFileSync(path.join(principlesDir, file), ldm_1.FileFormat.Utf8);
        try {
            (0, compile_principle_1.compilePrinciple)(md);
            results.push({ file, valid: true });
        }
        catch (error) {
            results.push({
                file,
                valid: false,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    return results;
};
exports.principlesVerify = principlesVerify;
//# sourceMappingURL=principles-verify.js.map