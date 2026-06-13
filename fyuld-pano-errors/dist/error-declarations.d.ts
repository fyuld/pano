import * as ts from "typescript";
export type ErrorReason = "extends-error" | "error-postfix" | "thrown";
export type DeclaredError = {
    name: string;
    file: string;
    line: number;
    reasons: ErrorReason[];
};
export declare const aggregateErrorDeclarations: (sourceFile: ts.SourceFile, filePath: string) => DeclaredError[];
//# sourceMappingURL=error-declarations.d.ts.map