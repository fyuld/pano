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
exports.collectClassConstructors = void 0;
const ts = __importStar(require("typescript"));
const lineOf = (ast, node) => ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
const baseNameOf = (expression) => {
    if (ts.isIdentifier(expression))
        return expression.text;
    if (ts.isPropertyAccessExpression(expression))
        return expression.name.text;
    return undefined;
};
const extendsNameOf = (node) => {
    const extendsClause = node.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);
    const base = extendsClause?.types[0];
    return base ? baseNameOf(base.expression) : undefined;
};
const accessorOf = (node) => {
    const constructor = node.members.find(ts.isConstructorDeclaration);
    if (!constructor)
        return "implicit";
    const flags = ts.getCombinedModifierFlags(constructor);
    if (flags & ts.ModifierFlags.Private)
        return "private";
    if (flags & ts.ModifierFlags.Protected)
        return "protected";
    return "public";
};
const categoryOf = (extendsName, extendsByClass) => {
    if (extendsName === undefined)
        return "Object";
    const visited = new Set();
    let current = extendsName;
    while (current !== undefined && !visited.has(current)) {
        visited.add(current);
        if (current.toLowerCase().includes("error"))
            return "Error";
        current = extendsByClass.get(current);
    }
    return "Other";
};
const collectClassConstructors = (sources) => {
    const found = [];
    const extendsByClass = new Map();
    for (const { file, ast } of sources) {
        const visit = (node) => {
            const isNamedClassDeclaration = ts.isClassDeclaration(node) && node.name !== undefined;
            if (isNamedClassDeclaration) {
                const extendsName = extendsNameOf(node);
                found.push({ name: node.name.text, extendsName, node, ast, file });
                extendsByClass.set(node.name.text, extendsName);
            }
            ts.forEachChild(node, visit);
        };
        visit(ast);
    }
    return found.map((cls) => ({
        name: cls.name,
        accessor: accessorOf(cls.node),
        category: categoryOf(cls.extendsName, extendsByClass),
        file: cls.file,
        line: lineOf(cls.ast, cls.node.name),
    }));
};
exports.collectClassConstructors = collectClassConstructors;
//# sourceMappingURL=class-constructors.js.map