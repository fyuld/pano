#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import {
  parseTypeScript,
  getAllComments,
  countCodeLines,
} from './languages/typescript'
import {
  collectOccurrences,
  OccurrenceBucket,
} from './collectors/collect-occurrences'
import { collectFindings, FindingBucket } from './collectors/collect-findings'
import { runPrinciples } from './principles/run-principles'
import { remarksOf } from './principles/render-remarks'
import { principlesCompile } from './cli/principles-compile'
import { principlesVerify } from './cli/principles-verify'
import { renderRunReport } from './cli/render-run-report'
import { ConfigError } from './cli/config-error'
import { writeFindings } from './cli/write-findings'
import { writeRemarks } from './cli/write-remarks'
import { setPretty } from './cli/format'
import { renderMarkdownAsAnsi } from './cli/render-markdown-ansi'
import { generateBddStepsForUx } from './bdd'
import { PanOpticumConfig, Principle, FileExtension } from './datamodel'
import { FileFormat, FyuldError } from '@fyuld/ldm'
import { safelyOverwriteFile } from './cli/safely-overwrite-file'

process.on('uncaughtException', (error) => {
  console.error(error instanceof FyuldError ? error.toMdString() : error)
  process.exit(1)
})

export const SuperDuper = 2

const SKIP_DIRS = new Set(['node_modules', 'dist', '.terraform'])
const SOURCE_EXTENSIONS = new Set(['.ts'])
const CONFIG_FILENAME = '.pano/pano.config.json'
const METRICS_DIR = '.metrics'
const OCCURRENCES_DIR = path.join(METRICS_DIR, '.occurences')
const FINDINGS_DIR = path.join(METRICS_DIR, '.findings')
const REMARKS_DIR = path.join(METRICS_DIR, '.remarks')
const TASKS_DIR = '.tasks'
const DefaultSpecsDirectory = 'specs'
const DefaultBddFeaturesDirectory = 'features'
const DefaultStoriesDirectory = 'stories'
const DefaultBddFeatureExtension = '.feature'
const DefaultPrinciplesDirectory = 'principles'
const DefaultCompiledPrinciplesDirectory = '.compiled-principles'

const expandGlob = (pattern: string, baseDir: string): string[] => {
  const parts = pattern.split('/')
  let dirs = [baseDir]
  for (const part of parts) {
    const next: string[] = []
    for (const d of dirs) {
      if (!part.includes('*')) {
        const candidate = path.join(d, part)
        try {
          if (fs.statSync(candidate).isDirectory()) next.push(candidate)
        } catch {
          // dir doesn't exist
        }
      } else {
        const regex = new RegExp('^' + part.replace(/\*/g, '.*') + '$')
        try {
          for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            const isMatchingSubdirectory =
              entry.isDirectory() && regex.test(entry.name)
            if (isMatchingSubdirectory) next.push(path.join(d, entry.name))
          }
        } catch {
          // dir not readable
        }
      }
    }
    dirs = next
  }
  return dirs
}

const walkSourceFiles = (dir: string, acc: string[] = []): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const isSourceFile =
      entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      walkSourceFiles(path.join(dir, entry.name), acc)
    } else if (isSourceFile) {
      acc.push(path.join(dir, entry.name))
    }
  }
  return acc
}

const findConfig = (startDir: string): string => {
  let dir = path.resolve(startDir)
  while (true) {
    const candidate = path.join(dir, CONFIG_FILENAME)
    if (fs.existsSync(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) {
      throw ConfigError.notFound(CONFIG_FILENAME, startDir)
    }
    dir = parent
  }
}

const loadConfig = (configPath: string): PanOpticumConfig =>
  JSON.parse(fs.readFileSync(configPath, FileFormat.Utf8)) as PanOpticumConfig

const resolveFiles = (
  dirs: string[],
  config: PanOpticumConfig,
  configDir: string
): string[] => {
  const repoRoot = path.dirname(configDir)
  const scanDirs =
    dirs.length > 0
      ? dirs
      : (config.observedDirectories?.sourceCode ?? []).flatMap((pattern) =>
          expandGlob(pattern, repoRoot)
        )
  return scanDirs
    .flatMap((d) => walkSourceFiles(d))
    .map((f) => (path.isAbsolute(f) ? f : path.resolve(f)))
}

const runAnalyze = (
  files: string[],
  config: PanOpticumConfig,
  configDir: string
): OccurrenceBucket[] => {
  const repoRoot = path.dirname(configDir)
  const occurrencesOutDir = path.join(configDir, OCCURRENCES_DIR)

  const occurrenceBuckets = collectOccurrences(files, repoRoot)
  for (const bucket of occurrenceBuckets) {
    writeFindings(
      bucket.occurrences,
      config.assessmentFormats,
      occurrencesOutDir,
      bucket.file
    )
  }
  return occurrenceBuckets
}

const runAssess = (
  occurrenceBuckets: OccurrenceBucket[],
  config: PanOpticumConfig,
  configDir: string
): FindingBucket[] => {
  const findingsOutDir = path.join(configDir, FINDINGS_DIR)

  const findingBuckets = collectFindings(occurrenceBuckets)
  for (const bucket of findingBuckets) {
    writeFindings(
      bucket.findings,
      config.assessmentFormats,
      findingsOutDir,
      bucket.file
    )
  }
  return findingBuckets
}

const evaluatePrinciples = (
  directories: string[],
  config: PanOpticumConfig,
  configDir: string
) => {
  const principlesDir = path.join(configDir, DefaultPrinciplesDirectory)
  const repoRoot = path.dirname(configDir)

  const files = resolveFiles(directories, config, configDir)
  const occurrenceBuckets = runAnalyze(files, config, configDir)
  const findingBuckets = runAssess(occurrenceBuckets, config, configDir)

  const doc = {
    ...Object.fromEntries(
      occurrenceBuckets.map((bucket) => [bucket.key, bucket.occurrences])
    ),
    ...Object.fromEntries(
      findingBuckets.map((bucket) => [bucket.key, bucket.findings])
    ),
  }
  const compiledDir = path.join(
    principlesDir,
    DefaultCompiledPrinciplesDirectory
  )
  if (!fs.existsSync(compiledDir)) {
    principlesCompile(principlesDir, compiledDir)
  }
  const compiledFiles = fs
    .readdirSync(compiledDir)
    .filter((file) => file.endsWith(FileExtension.Json))
  const principles = compiledFiles.map(
    (file) =>
      JSON.parse(
        fs.readFileSync(path.join(compiledDir, file), FileFormat.Utf8)
      ) as Principle
  )
  const verdicts = runPrinciples(principles, doc).map((verdict, index) => ({
    ...verdict,
    mdFile: path.relative(
      repoRoot,
      path.join(
        principlesDir,
        path.basename(compiledFiles[index], FileExtension.Json) +
          FileExtension.Md
      )
    ),
  }))

  let remarkId = 0
  for (const verdict of verdicts) {
    for (const remark of verdict.violations) {
      remark.remarkId = ++remarkId
      const { file, line } = remark
      const hasSourceCodeLocation =
        typeof file === 'string' && typeof line === 'number'
      if (hasSourceCodeLocation) {
        const absFile = path.join(repoRoot, file)
        remark.lineContent =
          fs
            .readFileSync(absFile, FileFormat.Utf8)
            .split('\n')
            [line - 1]?.trim() ?? ''
      }
    }
  }

  return verdicts
}

const printHelp = (): void => {
  console.log(`Usage: pano <command> [options] [args]

Commands:
  analyze <dirs...>             Walk directories and emit raw code occurrences
  assess <dirs...>              Walk directories and emit code assessments
  generate bdd-steps ux <path>  Generate Playwright-BDD step stubs (alias: gen)
  run <dirs...>                 Collect metrics and run principles against them
  taskify [ids...]              Write remarks as a .tasks/<timestamp>-Tasks.md checklist
  clean                         Delete generated metrics and compiled principles
  principles compile            Compile .pano/principles/*.md to .pano/principles/.compiled-principles/
  principles verify             Validate principle .md files
  help                          Show this message

Options:
  --plain-formatting            Disable colored output`)
}

const rawArgs = process.argv.slice(2)
let plainFormatting = false
const positional: string[] = []
for (const a of rawArgs) {
  if (a.startsWith('--')) {
    const name = a.indexOf('=') >= 0 ? a.slice(2, a.indexOf('=')) : a.slice(2)
    if (name === 'plain-formatting') {
      plainFormatting = true
    }
    continue
  }
  positional.push(a)
}
setPretty(process.stdout.isTTY && !plainFormatting)
const [subcommand, ...directories] = positional
const isGenerateSubcommand = subcommand === 'generate' || subcommand === 'gen'

if (subcommand === 'analyze') {
  const configPath = findConfig(process.cwd())
  const config = loadConfig(configPath)
  const configDir = path.dirname(configPath)
  const files = resolveFiles(directories, config, configDir)

  const buckets = runAnalyze(files, config, configDir)
  const outDir = path.join(configDir, OCCURRENCES_DIR)

  console.log(`Files: ${files.length}`)
  for (const bucket of buckets) {
    console.log(`${bucket.file}: ${bucket.occurrences.length}`)
  }
  console.log(`Wrote occurrences to ${outDir}`)
} else if (subcommand === 'assess') {
  const configPath = findConfig(process.cwd())
  const config = loadConfig(configPath)
  const configDir = path.dirname(configPath)
  const files = resolveFiles(directories, config, configDir)

  let totalLoC = 0
  let totalComments = 0
  for (const file of files) {
    if (!file.endsWith('.ts')) continue
    const source = fs.readFileSync(file, FileFormat.Utf8)
    const sourceFile = parseTypeScript(source, file)
    totalLoC += countCodeLines(sourceFile)
    totalComments += getAllComments(sourceFile).length
  }

  const occurrenceBuckets = runAnalyze(files, config, configDir)
  const buckets = runAssess(occurrenceBuckets, config, configDir)
  const outDir = path.join(configDir, FINDINGS_DIR)

  console.log(`Files: ${files.length}`)
  console.log(`Lines of code: ${totalLoC}`)
  console.log(`Comments: ${totalComments}`)
  for (const bucket of buckets) {
    console.log(`${bucket.file}: ${bucket.findings.length}`)
  }
  console.log(`Wrote assessments to ${outDir}`)
} else if (isGenerateSubcommand) {
  const [target, variant, inputPath] = directories
  const isBddStepsUxTarget = target === 'bdd-steps' && variant === 'ux'
  if (isBddStepsUxTarget) {
    void (async () => {
      const processFeature = async (f: string): Promise<void> => {
        const segments = f.split(path.sep)
        const idx = segments.lastIndexOf(DefaultBddFeaturesDirectory)
        if (idx === -1) {
          console.error(
            `Error: ${f} is not under a 'features/' directory. Input must contain a 'features' segment.`
          )
          process.exit(1)
        }
        const stepsSegments = [...segments]
        stepsSegments[idx] = 'steps'
        const last = stepsSegments.length - 1
        stepsSegments[last] = stepsSegments[last].replace(
          /\.feature$/,
          '.steps.ts'
        )
        const stepsPath = stepsSegments.join(path.sep)

        const fixturesSegments = [...segments]
        fixturesSegments[idx] = 'fixtures'
        fixturesSegments[fixturesSegments.length - 1] = fixturesSegments[
          fixturesSegments.length - 1
        ].replace(/\.feature$/, '')
        const fixturesDir = fixturesSegments.join(path.sep)

        const content = fs.readFileSync(f, FileFormat.Utf8)
        const generated = generateBddStepsForUx(content)
        const result = await safelyOverwriteFile(stepsPath, generated)
        fs.mkdirSync(fixturesDir, { recursive: true })
        console.log(`${result}: ${stepsPath}`)
        console.log(`fixtures: ${fixturesDir}`)
      }

      const features: string[] = []
      const stat = fs.statSync(inputPath)
      if (stat.isDirectory()) {
        const walk = (dir: string): void => {
          for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            if (e.isDirectory()) walk(path.join(dir, e.name))
            else if (e.name.endsWith(DefaultBddFeatureExtension))
              features.push(path.join(dir, e.name))
          }
        }
        walk(inputPath)
      } else if (inputPath.endsWith('.ts')) {
        const base = path.basename(inputPath, '.ts')
        const featurePath = path.join(
          DefaultSpecsDirectory,
          DefaultBddFeaturesDirectory,
          `${base}.feature`
        )
        const storyPath = path.join(
          DefaultSpecsDirectory,
          DefaultStoriesDirectory,
          `${base}.story.tsx`
        )
        const featureResult = await safelyOverwriteFile(
          featurePath,
          `Feature: ${base}\n`
        )
        const storyResult = await safelyOverwriteFile(storyPath, '')
        console.log(`${featureResult}: ${featurePath}`)
        console.log(`${storyResult}: ${storyPath}`)
        features.push(featurePath)
      } else {
        features.push(inputPath)
      }
      for (const f of features) {
        await processFeature(f)
      }
    })()
  }
} else if (subcommand === 'principles') {
  const configPath = findConfig(process.cwd())
  const configDir = path.dirname(configPath)
  const principlesDir = path.join(configDir, DefaultPrinciplesDirectory)
  const [action] = directories
  if (action === 'compile') {
    const outDir = path.join(principlesDir, DefaultCompiledPrinciplesDirectory)
    for (const c of principlesCompile(principlesDir, outDir)) {
      console.log(`${c.name} -> ${c.out}`)
    }
  } else if (action === 'verify') {
    let allValid = true
    for (const result of principlesVerify(principlesDir)) {
      if (result.valid) {
        console.log(`VALID    ${result.file}`)
      } else {
        allValid = false
        console.log(`INVALID  ${result.file}`)
        console.log(`         ${result.error}`)
      }
    }
    if (!allValid) process.exit(1)
  } else {
    printHelp()
  }
} else if (subcommand === 'run') {
  const configPath = findConfig(process.cwd())
  const configDir = path.dirname(configPath)
  const config = loadConfig(configPath)

  const verdicts = evaluatePrinciples(directories, config, configDir)

  const markdown = renderRunReport(verdicts)
  writeRemarks(remarksOf(verdicts), path.join(configDir, REMARKS_DIR), markdown)
  renderMarkdownAsAnsi(markdown)
} else if (subcommand === 'taskify') {
  const configPath = findConfig(process.cwd())
  const configDir = path.dirname(configPath)
  const config = loadConfig(configPath)

  const ids = directories
    .join(',')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
    .map(Number)
    .filter((n) => !Number.isNaN(n))
  const idSet = ids.length > 0 ? new Set(ids) : null

  const verdicts = evaluatePrinciples([], config, configDir)
  const withRemarks = verdicts.filter(
    (verdict) => verdict.violations.length > 0
  )
  const selected =
    idSet === null
      ? withRemarks
      : withRemarks
          .map((verdict) => ({
            ...verdict,
            violations: verdict.violations.filter((r) =>
              idSet.has(r.remarkId as number)
            ),
          }))
          .filter((verdict) => verdict.violations.length > 0)

  const stamp = new Date().toISOString()
  const markdown = `Tasks\n---\n\n${renderRunReport(selected, true)}`

  const tasksDir = path.join(configDir, TASKS_DIR)
  fs.mkdirSync(tasksDir, { recursive: true })
  const outPath = path.join(tasksDir, `${stamp.replace(/[:.]/g, '-')}-Tasks.md`)
  fs.writeFileSync(outPath, markdown)
  console.log(`Wrote tasks to ${outPath}`)
} else if (subcommand === 'clean') {
  const configPath = findConfig(process.cwd())
  const configDir = path.dirname(configPath)
  const metricsDir = path.join(configDir, METRICS_DIR)
  const compiledDir = path.join(
    configDir,
    DefaultPrinciplesDirectory,
    DefaultCompiledPrinciplesDirectory
  )
  fs.rmSync(metricsDir, { recursive: true, force: true })
  fs.rmSync(compiledDir, { recursive: true, force: true })
  console.log(`Removed ${metricsDir}`)
  console.log(`Removed ${compiledDir}`)
} else {
  printHelp()
}
