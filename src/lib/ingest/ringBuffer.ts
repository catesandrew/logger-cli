export class RingBuffer<T> {
  private readonly values: T[] = []

  constructor(private readonly maxSize: number) {}

  push(value: T): void {
    this.values.push(value)
    if (this.values.length > this.maxSize) {
      this.values.splice(0, this.values.length - this.maxSize)
    }
  }

  toArray(reverse = false): T[] {
    return reverse ? [...this.values].reverse() : [...this.values]
  }

  get size(): number {
    return this.values.length
  }
}
