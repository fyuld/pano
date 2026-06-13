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
exports.collectErrorEntries = void 0;
const path = __importStar(require("path"));
const ts = __importStar(require("typescript"));
const error_declarations_1 = require("./error-declarations");
const PRIMITIVE_MASK = ts.TypeFlags.StringLike |
    ts.TypeFlags.NumberLike |
    ts.TypeFlags.BooleanLike |
    ts.TypeFlags.BigIntLike |
    ts.TypeFlags.ESSymbolLike |
    ts.TypeFlags.Null |
    ts.TypeFlags.Undefined |
    ts.TypeFlags.Void;
const lineOf = (sourceFile, node) => sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
const instantiationOf = (expr) => {
    if (ts.isNewExpression(expr))
        return "constructor";
    if (ts.isCallExpression(expr))
        return "factory";
    return "other";
};
const collectErrorEntries = (files) => {
    const program = ts.createProgram(files, {
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.Node10,
        skipLibCheck: true,
        noEmit: true,
    });
    const checker = program.getTypeChecker();
    const targets = new Set(files.map((f) => path.resolve(f)));
    const bucket = new Map();
    const isClassOrInterface = (type) => {
        if ((type.flags & ts.TypeFlags.Object) === 0)
            return false;
        const objectFlags = type.objectFlags;
        return ((objectFlags & (ts.ObjectFlags.Class | ts.ObjectFlags.Interface)) !== 0);
    };
    const errorChainOf = (type) => {
        const selfName = (type.aliasSymbol ?? type.getSymbol())?.getName();
        if (selfName === "Error")
            return ["Error"];
        if (!isClassOrInterface(type))
            return [];
        for (const base of checker.getBaseTypes(type)) {
            if (base.getSymbol()?.getName() === "Object")
                continue;
            const sub = errorChainOf(base);
            if (sub.length > 0)
                return selfName ? [selfName, ...sub] : sub;
        }
        return [];
    };
    const errorTypeName = (type) => {
        const symbol = type.aliasSymbol ?? type.getSymbol();
        if (!symbol)
            return undefined;
        const name = symbol.getName();
        if (name.startsWith("__"))
            return undefined;
        return name;
    };
    const collectErrorTypes = (type) => {
        if (type.isUnion())
            return type.types.flatMap(collectErrorTypes);
        if ((type.flags & PRIMITIVE_MASK) !== 0)
            return [];
        return [type];
    };
    const ensure = (name) => {
        const existing = bucket.get(name);
        if (existing)
            return existing;
        const created = {
            name,
            reasons: [],
            inheritancePath: [],
            thrownAt: [],
        };
        bucket.set(name, created);
        return created;
    };
    const addReason = (entry, reason) => {
        if (!entry.reasons.includes(reason))
            entry.reasons.push(reason);
    };
    const setPath = (entry, chain) => {
        const shouldSetInheritancePath = entry.inheritancePath.length === 0 && chain.length > 0;
        if (shouldSetInheritancePath) {
            entry.inheritancePath = chain;
        }
    };
    for (const sourceFile of program.getSourceFiles()) {
        if (!targets.has(path.resolve(sourceFile.fileName)))
            continue;
        const filePath = path.relative(process.cwd(), sourceFile.fileName);
        for (const declared of (0, error_declarations_1.aggregateErrorDeclarations)(sourceFile, filePath)) {
            const entry = ensure(declared.name);
            for (const reason of declared.reasons)
                addReason(entry, reason);
            if (!entry.declaredAt) {
                entry.declaredAt = { file: declared.file, line: declared.line };
            }
        }
        const visit = (node) => {
            const isNamedClassDeclaration = ts.isClassDeclaration(node) && node.name !== undefined;
            if (isNamedClassDeclaration) {
                const symbol = checker.getSymbolAtLocation(node.name);
                if (symbol) {
                    const chain = errorChainOf(checker.getDeclaredTypeOfSymbol(symbol));
                    if (chain.length > 0) {
                        const entry = ensure(node.name.text);
                        addReason(entry, "extends-error");
                        if (!entry.declaredAt) {
                            entry.declaredAt = {
                                file: filePath,
                                line: lineOf(sourceFile, node.name),
                            };
                        }
                        setPath(entry, chain);
                    }
                }
            }
            else if (ts.isThrowStatement(node)) {
                const line = lineOf(sourceFile, node);
                const instantiation = instantiationOf(node.expression);
                const type = checker.getTypeAtLocation(node.expression);
                for (const thrown of collectErrorTypes(type)) {
                    const name = errorTypeName(thrown);
                    if (!name)
                        continue;
                    const entry = ensure(name);
                    addReason(entry, "thrown");
                    entry.thrownAt.push({ file: filePath, line, instantiation });
                    setPath(entry, errorChainOf(thrown));
                }
            }
            node.forEachChild(visit);
        };
        visit(sourceFile);
    }
    return [...bucket.values()];
};
exports.collectErrorEntries = collectErrorEntries;
//# sourceMappingURL=errors.js.map