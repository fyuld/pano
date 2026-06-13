import * as path from "path";
import * as ts from "typescript";
import { aggregateErrorDeclarations, ErrorReason } from "./error-declarations";

export type ErrorLocation = {
  file: string;
  line: number;
};

export type ThrownAt = ErrorLocation & {
  instantiation: "constructor" | "factory" | "other";
};

export type ErrorEntry = {
  name: string;
  reasons: ErrorReason[];
  inheritancePath: string[];
  declaredAt?: ErrorLocation;
  thrownAt: ThrownAt[];
};

export type ErrorsReport = {
  totalErrors: number;
  errors: ErrorEntry[];
};

const PRIMITIVE_MASK =
  ts.TypeFlags.StringLike |
  ts.TypeFlags.NumberLike |
  ts.TypeFlags.BooleanLike |
  ts.TypeFlags.BigIntLike |
  ts.TypeFlags.ESSymbolLike |
  ts.TypeFlags.Null |
  ts.TypeFlags.Undefined |
  ts.TypeFlags.Void;

const lineOf = (sourceFile: ts.SourceFile, node: ts.Node): number =>
  sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

const instantiationOf = (
  expr: ts.Expression,
): "constructor" | "factory" | "other" => {
  if (ts.isNewExpression(expr)) return "constructor";
  if (ts.isCallExpression(expr)) return "factory";
  return "other";
};

export const collectErrorEntries = (files: string[]): ErrorEntry[] => {
  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    skipLibCheck: true,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const targets = new Set(files.map((f) => path.resolve(f)));
  const bucket = new Map<string, ErrorEntry>();

  const isClassOrInterface = (type: ts.Type): boolean => {
    if ((type.flags & ts.TypeFlags.Object) === 0) return false;
    const objectFlags = (type as ts.ObjectType).objectFlags;
    return (
      (objectFlags & (ts.ObjectFlags.Class | ts.ObjectFlags.Interface)) !== 0
    );
  };

  const errorChainOf = (type: ts.Type): string[] => {
    const selfName = (type.aliasSymbol ?? type.getSymbol())?.getName();
    if (selfName === "Error") return ["Error"];
    if (!isClassOrInterface(type)) return [];
    for (const base of checker.getBaseTypes(type as ts.InterfaceType)) {
      if (base.getSymbol()?.getName() === "Object") continue;
      const sub = errorChainOf(base);
      if (sub.length > 0) return selfName ? [selfName, ...sub] : sub;
    }
    return [];
  };

  const errorTypeName = (type: ts.Type): string | undefined => {
    const symbol = type.aliasSymbol ?? type.getSymbol();
    if (!symbol) return undefined;
    const name = symbol.getName();
    if (name.startsWith("__")) return undefined;
    return name;
  };

  const collectErrorTypes = (type: ts.Type): ts.Type[] => {
    if (type.isUnion()) return type.types.flatMap(collectErrorTypes);
    if ((type.flags & PRIMITIVE_MASK) !== 0) return [];
    return [type];
  };

  const ensure = (name: string): ErrorEntry => {
    const existing = bucket.get(name);
    if (existing) return existing;
    const created: ErrorEntry = {
      name,
      reasons: [],
      inheritancePath: [],
      thrownAt: [],
    };
    bucket.set(name, created);
    return created;
  };

  const addReason = (entry: ErrorEntry, reason: ErrorReason): void => {
    if (!entry.reasons.includes(reason)) entry.reasons.push(reason);
  };

  const setPath = (entry: ErrorEntry, chain: string[]): void => {
    const shouldSetInheritancePath =
      entry.inheritancePath.length === 0 && chain.length > 0;
    if (shouldSetInheritancePath) {
      entry.inheritancePath = chain;
    }
  };

  for (const sourceFile of program.getSourceFiles()) {
    if (!targets.has(path.resolve(sourceFile.fileName))) continue;
    const filePath = path.relative(process.cwd(), sourceFile.fileName);

    for (const declared of aggregateErrorDeclarations(sourceFile, filePath)) {
      const entry = ensure(declared.name);
      for (const reason of declared.reasons) addReason(entry, reason);
      if (!entry.declaredAt) {
        entry.declaredAt = { file: declared.file, line: declared.line };
      }
    }

    const visit = (node: ts.Node): void => {
      const isNamedClassDeclaration =
        ts.isClassDeclaration(node) && node.name !== undefined;
      if (isNamedClassDeclaration) {
        const symbol = checker.getSymbolAtLocation(node.name!);
        if (symbol) {
          const chain = errorChainOf(checker.getDeclaredTypeOfSymbol(symbol));
          if (chain.length > 0) {
            const entry = ensure(node.name!.text);
            addReason(entry, "extends-error");
            if (!entry.declaredAt) {
              entry.declaredAt = {
                file: filePath,
                line: lineOf(sourceFile, node.name!),
              };
            }
            setPath(entry, chain);
          }
        }
      } else if (ts.isThrowStatement(node)) {
        const line = lineOf(sourceFile, node);
        const instantiation = instantiationOf(node.expression);
        const type = checker.getTypeAtLocation(node.expression);
        for (const thrown of collectErrorTypes(type)) {
          const name = errorTypeName(thrown);
          if (!name) continue;
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
