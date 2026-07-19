import { FyuldError } from '@fyuld/ldm';
export declare class FindingError extends FyuldError {
    protected constructor(detail: string, format: string);
    static unknownFormat(format: string): FindingError;
}
//# sourceMappingURL=finding-error.d.ts.map