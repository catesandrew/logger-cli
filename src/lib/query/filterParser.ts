import type { ComparisonOperator, FieldPathStep, FieldRef, FilterNode, FilterValue } from './filterAst.js'

type Token =
  | { type: 'identifier'; value: string }
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'null' }
  | { type: 'operator'; value: string }
  | { type: 'lparen' | 'rparen' | 'comma' | 'dot' | 'qmark' | 'lbracket' | 'rbracket' }

function isIdentifierStart(char: string): boolean {
  return /[A-Za-z_]/.test(char)
}

function isIdentifierPart(char: string): boolean {
  return /[A-Za-z0-9_-]/.test(char)
}

export function tokenizeFilter(input: string): Token[] {
  const tokens: Token[] = []
  let index = 0

  while (index < input.length) {
    const char = input[index]
    if (!char) break
    if (/\s/.test(char)) {
      index += 1
      continue
    }

    if (char === '(') {
      tokens.push({ type: 'lparen' })
      index += 1
      continue
    }
    if (char === ')') {
      tokens.push({ type: 'rparen' })
      index += 1
      continue
    }
    if (char === ',') {
      tokens.push({ type: 'comma' })
      index += 1
      continue
    }
    if (char === '.') {
      tokens.push({ type: 'dot' })
      index += 1
      continue
    }
    if (char === '?') {
      tokens.push({ type: 'qmark' })
      index += 1
      continue
    }
    if (char === '[') {
      tokens.push({ type: 'lbracket' })
      index += 1
      continue
    }
    if (char === ']') {
      tokens.push({ type: 'rbracket' })
      index += 1
      continue
    }

    const three = input.slice(index, index + 3)
    if (['!~=', '~~='].includes(three)) {
      tokens.push({ type: 'operator', value: three })
      index += 3
      continue
    }
    const two = input.slice(index, index + 2)
    if (['!=', '>=', '<=', '~='].includes(two)) {
      tokens.push({ type: 'operator', value: two })
      index += 2
      continue
    }
    if (['=', '>', '<'].includes(char)) {
      tokens.push({ type: 'operator', value: char })
      index += 1
      continue
    }

    if (char === '"') {
      let value = ''
      index += 1
      while (index < input.length && input[index] !== '"') {
        const current = input[index]
        if (current === '\\' && index + 1 < input.length) {
          value += `\\${input[index + 1] ?? ''}`
          index += 2
          continue
        }
        value += current ?? ''
        index += 1
      }
      index += 1
      tokens.push({ type: 'string', value })
      continue
    }

    const remainder = input.slice(index)
    const numberMatch = remainder.match(/^-?\d+(?:\.\d+)?/)
    if (numberMatch?.[0]) {
      tokens.push({ type: 'number', value: Number(numberMatch[0]) })
      index += numberMatch[0].length
      continue
    }

    if (isIdentifierStart(char)) {
      let value = char
      index += 1
      while (index < input.length && isIdentifierPart(input[index] ?? '')) {
        value += input[index]
        index += 1
      }
      if (value === 'true' || value === 'false') {
        tokens.push({ type: 'boolean', value: value === 'true' })
      } else if (value === 'null') {
        tokens.push({ type: 'null' })
      } else {
        tokens.push({ type: 'identifier', value })
      }
      continue
    }

    throw new Error(`Unexpected token near: ${remainder}`)
  }

  return tokens
}

class Parser {
  private index = 0

  constructor(private readonly tokens: Token[]) {}

  parse(): FilterNode {
    const node = this.parseOr()
    if (this.peek()) {
      throw new Error('Unexpected trailing tokens in filter')
    }
    return node
  }

  private parseOr(): FilterNode {
    let node = this.parseAnd()
    while (this.isIdentifier('or')) {
      this.consume()
      node = { type: 'or', left: node, right: this.parseAnd() }
    }
    return node
  }

  private parseAnd(): FilterNode {
    let node = this.parseNot()
    while (this.isIdentifier('and')) {
      this.consume()
      node = { type: 'and', left: node, right: this.parseNot() }
    }
    return node
  }

  private parseNot(): FilterNode {
    if (this.isIdentifier('not')) {
      this.consume()
      return { type: 'not', node: this.parseNot() }
    }
    return this.parsePrimary()
  }

  private parsePrimary(): FilterNode {
    if (this.peek()?.type === 'lparen') {
      this.consume()
      const node = this.parseOr()
      this.expect('rparen')
      return node
    }

    if (this.isIdentifier('exists')) {
      this.consume()
      this.expect('lparen')
      const field = this.parseFieldRef()
      this.expect('rparen')
      return { type: 'exists', field }
    }

    return this.parseComparison()
  }

  private parseComparison(): FilterNode {
    const field = this.parseFieldRef()

    if (this.isIdentifier('not') && this.peek(1)?.type === 'identifier' && (this.peek(1) as Token & { value: string }).value === 'in') {
      this.consume()
      this.consume()
      return {
        type: 'comparison',
        field,
        operator: 'not in',
        value: this.parseList(),
      }
    }

    if (this.isIdentifier('in')) {
      this.consume()
      return {
        type: 'comparison',
        field,
        operator: 'in',
        value: this.parseList(),
      }
    }

    const operatorToken = this.consume()
    if (!operatorToken || operatorToken.type !== 'operator' && !(operatorToken.type === 'identifier' && operatorToken.value === 'like')) {
      throw new Error('Expected comparison operator')
    }

    const operator = (operatorToken.type === 'operator' ? operatorToken.value : operatorToken.value) as ComparisonOperator
    const value = this.parseValue()
    return { type: 'comparison', field, operator, value }
  }

  private parseList(): FilterValue[] {
    this.expect('lparen')
    const values: FilterValue[] = []
    while (this.peek() && this.peek()?.type !== 'rparen') {
      values.push(this.parseValue())
      if (this.peek()?.type === 'comma') {
        this.consume()
      } else {
        break
      }
    }
    this.expect('rparen')
    return values
  }

  private parseFieldRef(): FieldRef {
    const steps: FieldPathStep[] = []
    let leadingDot = false
    let optional = false

    if (this.peek()?.type === 'dot') {
      leadingDot = true
      this.consume()
    }

    while (true) {
      const token = this.peek()
      if (!token) break

      if (token.type === 'identifier') {
        steps.push({ kind: 'key', value: token.value })
        this.consume()
      } else if (token.type === 'lbracket') {
        this.consume()
        if (this.peek()?.type === 'rbracket') {
          this.consume()
          steps.push({ kind: 'wildcard' })
        } else {
          const indexToken = this.consume()
          if (!indexToken || indexToken.type !== 'number') {
            throw new Error('Expected array index')
          }
          this.expect('rbracket')
          steps.push({ kind: 'index', value: indexToken.value })
        }
      } else {
        break
      }

      if (this.peek()?.type === 'dot') {
        this.consume()
        continue
      }

      if (this.peek()?.type === 'qmark') {
        optional = true
        this.consume()
      }
      break
    }

    if (steps.length === 0) {
      throw new Error('Expected field path')
    }

    const raw = steps
      .map((step) => {
        if (step.kind === 'key') return String(step.value)
        if (step.kind === 'wildcard') return '[]'
        return `[${step.value}]`
      })
      .join('.')

    return { raw, leadingDot, optional, steps }
  }

  private parseValue(): FilterValue {
    const token = this.consume()
    if (!token) {
      throw new Error('Expected value')
    }
    if (token.type === 'string' || token.type === 'number' || token.type === 'boolean') {
      return token.value
    }
    if (token.type === 'null') {
      return null
    }
    if (token.type === 'identifier') {
      return token.value
    }
    throw new Error('Invalid value')
  }

  private isIdentifier(value: string): boolean {
    const token = this.peek()
    return Boolean(token && token.type === 'identifier' && token.value === value)
  }

  private expect(type: Token['type']): void {
    const token = this.consume()
    if (!token || token.type !== type) {
      throw new Error(`Expected ${type}`)
    }
  }

  private peek(offset = 0): Token | undefined {
    return this.tokens[this.index + offset]
  }

  private consume(): Token | undefined {
    const token = this.tokens[this.index]
    if (token) this.index += 1
    return token
  }
}

export function parseFilterAst(input: string): FilterNode | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const parser = new Parser(tokenizeFilter(trimmed))
  return parser.parse()
}
