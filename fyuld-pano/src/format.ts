let usePretty = true

export const setPretty = (b: boolean): void => {
  usePretty = b
}

export const styled = (codes: string, text: string): string =>
  usePretty ? `\x1b[${codes}m${text}\x1b[0m` : text

export const SuperDuper = 1
