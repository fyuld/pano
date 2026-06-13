import { Metric } from "@fyuld/pano-dm";
import { collectErrorEntries } from "./errors";

export const aggregateThrows = (files: string[]): Metric[] =>
  collectErrorEntries(files).flatMap((entry) =>
    entry.thrownAt.map((at) => ({
      label: entry.name,
      file: at.file,
      line: at.line,
      instantiation: at.instantiation,
      inheritancePath: entry.inheritancePath,
    })),
  );
