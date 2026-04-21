import fs from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import type { LoggerConfig } from '../../types.js'

const KeybindingsSchema = z.record(z.array(z.string())).optional()
const LevelMapSchema = z.record(z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'unknown'])).optional()
const ConfigSchema = z.object({
  columns: z.array(z.object({
    key: z.string(),
    path: z.string(),
  })).default([]),
  keybindings: KeybindingsSchema.default({}),
  mainLineTemplate: z.string().optional(),
  placeholderFormat: z.string().optional(),
  contextPath: z.string().optional(),
  levelMap: LevelMapSchema.default({}),
})

const DEFAULT_CONFIG: LoggerConfig = {
  columns: [],
  keybindings: {},
  mainLineTemplate: '{{timestamp}} {{level_style (min_size level 5)}} {{prefix}}{{message}}',
  placeholderFormat: '#{key}',
  contextPath: 'extra_data',
  levelMap: {},
}

function stripJsonComments(text: string): string {
  return text.replace(/^\s*\/\/.*$/gm, '')
}

async function readConfigFile(filePath: string): Promise<LoggerConfig | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(stripJsonComments(content))
    return ConfigSchema.parse(parsed)
  } catch {
    return null
  }
}

export async function loadLoggerConfig(input: {
  cwd?: string
  home?: string
  configPath?: string
} = {}): Promise<LoggerConfig> {
  const cwd = input.cwd ?? process.cwd()
  const home = input.home ?? process.env.HOME ?? process.env.USERPROFILE ?? cwd
  if (input.configPath) {
    return (await readConfigFile(path.resolve(input.configPath))) ?? DEFAULT_CONFIG
  }

  const homeConfig = await readConfigFile(path.join(home, '.config', 'logger', 'config.jsonc'))
  const cwdConfig = await readConfigFile(path.join(cwd, '.logger.jsonc'))

  return { ...DEFAULT_CONFIG, ...(homeConfig ?? {}), ...(cwdConfig ?? {}) }
}
