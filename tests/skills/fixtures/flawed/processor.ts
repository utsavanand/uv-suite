// PLANTED ISSUE (over-engineering slop): a factory + interface for a single
// implementation. Should just be a plain function.
interface Processor {
  run(x: number): number;
}

class DoubleProcessor implements Processor {
  run(x: number): number {
    return x * 2;
  }
}

class ProcessorFactory {
  static create(type: string): Processor {
    switch (type) {
      case "double":
        return new DoubleProcessor();
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }
}

export function runAll(items: number[]): number[] {
  const processor = ProcessorFactory.create("double");
  // Loop through the items   <- PLANTED ISSUE (comment slop): restates the code
  return items.map((i) => processor.run(i));
}
