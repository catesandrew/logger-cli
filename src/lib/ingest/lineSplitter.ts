export class LineSplitter {
  private remainder = ''

  push(chunk: string): string[] {
    const combined = this.remainder + chunk
    const lines = combined.split(/\r?\n/)
    this.remainder = lines.pop() ?? ''
    return lines
  }

  flush(): string[] {
    if (!this.remainder) {
      return []
    }
    const last = this.remainder
    this.remainder = ''
    return [last]
  }
}
