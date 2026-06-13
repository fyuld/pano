import { ErrorReason } from "./error-declarations";
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
export declare const collectErrorEntries: (files: string[]) => ErrorEntry[];
//# sourceMappingURL=errors.d.ts.map