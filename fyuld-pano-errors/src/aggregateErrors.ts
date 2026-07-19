import { collectErrorEntries } from "./errors";

export const aggregateErrors = (files: string[]) =>
  collectErrorEntries(files)
    .filter((entry) => entry.declaredAt)
    .map((entry) => ({
      label: entry.name,
      file: entry.declaredAt!.file,
      line: entry.declaredAt!.line,
      reasons: entry.reasons,
      inheritancePath: entry.inheritancePath,
    }));
