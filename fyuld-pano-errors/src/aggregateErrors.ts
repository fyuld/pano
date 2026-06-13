import { Metric } from "@fyuld/pano-dm";
import { collectErrorEntries } from "./errors";

export const aggregateErrors = (files: string[]): Metric[] =>
  collectErrorEntries(files)
    .filter((entry) => entry.declaredAt)
    .map((entry) => ({
      label: entry.name,
      file: entry.declaredAt!.file,
      line: entry.declaredAt!.line,
      reasons: entry.reasons,
      inheritancePath: entry.inheritancePath,
    }));
