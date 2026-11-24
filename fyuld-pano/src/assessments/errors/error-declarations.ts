import * as ts from "typescript";

export type ErrorReason = "extends-error" | "error-postfix" | "thrown";

export type DeclaredError = {
  name: string;
  file: string;
  line: number;
  reasons: ErrorReason[];
};

const nameLooksLikeError = (name: string): boolean => name.endsWith("Error");

const lineOf = (sourceFile: ts.SourceFile, node: ts.Node): number =>
  sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

export const aggregateErrorDeclarations = (
  sourceFile: ts.SourceFile,
  filePath: string,
): DeclaredError[] => {
  const out: DeclaredError[] = [];
  const visit = (node: ts.Node): void => {
    const isErrorTypeDeclaration =
      (ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node)) &&
      node.name !== undefined &&
      nameLooksLikeError(node.name.text);
    if (isErrorTypeDeclaration) {
      out.push({
        name: node.name!.text,
        file: filePath,
        line: lineOf(sourceFile, node.name!),
        reasons: ["error-postfix"],
      });
    }
    node.forEachChild(visit);
  };
  visit(sourceFile);
  return out;
};
