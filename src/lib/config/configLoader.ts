import fs from 'node:fs/promises'
import path from 'node:path'
import type { LoggerConfig } from '../../types.js'

const DEFAULT_CONFIG: LoggerConfig = {
  columns: [],
}

function stripJsonComments(text: string): string {
  return text.replace(/^\s*\/\/.*$/gm, '')
}

async function readConfigFile(filePath: string): Promise<LoggerConfig | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(stripJsonComments(content)) as Partial<LoggerConfig>
    return {
      columns: Array.isArray(parsed.columns) ? parsed.columns : [],
    }
  } catch {
    return null
  }
}

export async function loadLoggerConfig(input: {
  cwd?: string
  home?: string
} = {}): Promise<LoggerConfig> {
  const cwd = input.cwd ?? process.cwd()
  const home = input.home ?? process.env.HOME ?? process.env.USERPROFILE ?? cwd

  const homeConfig = await readConfigFile(path.join(home, '.logger.jsonc'))
  const cwdConfig = await readConfigFile(path.join(cwd, '.logger.jsonc'))

  return cwdConfig ?? homeConfig ?? DEFAULT_CONFIG
}
