import type { LogEntry } from '../../types.js'
import type { FilterNode } from './filterAst.js'
import { evaluateFilterNode } from './filterEval.js'
import { parseFilterAst } from './filterParser.js'

export function parseQuery(input: string): FilterNode | null {
  return parseFilterAst(input)
}

export function matchesQuery(entry: LogEntry, node: FilterNode | null): boolean {
  return node ? evaluateFilterNode(entry, node) : true
}
