export type FilterValue = string | number | boolean | null

export interface FieldPathStep {
  kind: 'key' | 'index' | 'wildcard'
  value?: string | number
}

export interface FieldRef {
  raw: string
  leadingDot: boolean
  optional: boolean
  steps: FieldPathStep[]
}

export type FilterNode =
  | { type: 'and'; left: FilterNode; right: FilterNode }
  | { type: 'or'; left: FilterNode; right: FilterNode }
  | { type: 'not'; node: FilterNode }
  | { type: 'exists'; field: FieldRef }
  | { type: 'comparison'; field: FieldRef; operator: ComparisonOperator; value: FilterValue | FilterValue[] }

export type ComparisonOperator =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | '~='
  | '!~='
  | 'like'
  | '~~='
  | 'in'
  | 'not in'
