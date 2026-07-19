import { FyuldError } from '@fyuld/ldm';
export declare class ConfigError extends FyuldError {
    protected constructor(detail: string, startDir: string);
    static notFound(filename: string, startDir: string): ConfigError;
}
//# sourceMappingURL=config-error.d.ts.map