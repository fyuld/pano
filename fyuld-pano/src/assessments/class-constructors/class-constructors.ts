import * as ts from "typescript";

export type ParsedSource = { file: string; ast: ts.SourceFile };

export type ClassConstructorAccessor =
  | "public"
  | "protected"
  | "private"
  | "implicit";

export type ClassConstructorCategory = "Object" | "Error" | "Other";

export type ClassConstructorRow = {
  name: string;
  accessor: ClassConstructorAccessor;
  category: ClassConstructorCategory;
  file: string;
  line: number;
};

const lineOf = (ast: ts.SourceFile, node: ts.Node): number =>
  ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;

const baseNameOf = (expression: ts.Expression): string | undefined => {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return undefined;
};

const extendsNameOf = (node: ts.ClassDeclaration): string | undefined => {
  const extendsClause = node.heritageClauses?.find(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
  );
  const base = extendsClause?.types[0];
  return base ? baseNameOf(base.expression) : undefined;
};

const accessorOf = (node: ts.ClassDeclaration): ClassConstructorAccessor => {
  const constructor = node.members.find(ts.isConstructorDeclaration);
  if (!constructor) return "implicit";
  const flags = ts.getCombinedModifierFlags(constructor);
  if (flags & ts.ModifierFlags.Private) return "private";
  if (flags & ts.ModifierFlags.Protected) return "protected";
  return "public";
};

const categoryOf = (
  extendsName: string | undefined,
  extendsByClass: Map<string, string | undefined>,
): ClassConstructorCategory => {
  if (extendsName === undefined) return "Object";
  const visited = new Set<string>();
  let current: string | undefined = extendsName;
  while (current !== undefined && !visited.has(current)) {
    visited.add(current);
    if (current.toLowerCase().includes("error")) return "Error";
    current = extendsByClass.get(current);
  }
  return "Other";
};

export const collectClassConstructors = (
  sources: ParsedSource[],
): ClassConstructorRow[] => {
  type FoundClass = {
    name: string;
    extendsName: string | undefined;
    node: ts.ClassDeclaration;
    ast: ts.SourceFile;
    file: string;
  };
  const found: FoundClass[] = [];
  const extendsByClass = new Map<string, string | undefined>();

  for (const { file, ast } of sources) {
    const visit = (node: ts.Node): void => {
      const isNamedClassDeclaration =
        ts.isClassDeclaration(node) && node.name !== undefined;
      if (isNamedClassDeclaration) {
        const extendsName = extendsNameOf(node);
        found.push({ name: node.name!.text, extendsName, node, ast, file });
        extendsByClass.set(node.name!.text, extendsName);
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
    line: lineOf(cls.ast, cls.node.name!),
  }));
};
