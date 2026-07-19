import * as ts from "typescript";
export type ParsedSource = {
    file: string;
    ast: ts.SourceFile;
};
export type ClassConstructorAccessor = "public" | "protected" | "private" | "implicit";
export type ClassConstructorCategory = "Object" | "Error" | "Other";
export type ClassConstructorRow = {
    name: string;
    accessor: ClassConstructorAccessor;
    category: ClassConstructorCategory;
    file: string;
    line: number;
};
export declare const collectClassConstructors: (sources: ParsedSource[]) => ClassConstructorRow[];
//# sourceMappingURL=class-constructors.d.ts.map