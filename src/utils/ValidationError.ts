// Custom error types for validation
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConsecutiveOperatorError extends ValidationError {
  constructor() {
    super('Cannot enter consecutive operators');
    this.name = 'ConsecutiveOperatorError';
  }
}

export class MixedTypeError extends ValidationError {
  constructor() {
    super('Cannot mix scalar and Imperial measurements');
    this.name = 'MixedTypeError';
  }
}

export class EmptyExpressionError extends ValidationError {
  constructor() {
    super("That doesn't make any sense");
    this.name = 'EmptyExpressionError';
  }
}

export class DivisionByZeroError extends ValidationError {
  constructor() {
    super('Division by zero');
    this.name = 'DivisionByZeroError';
  }
}

export class UnsupportedOperationError extends ValidationError {
  constructor(operation: string) {
    super(`Unsupported operation: ${operation}`);
    this.name = 'UnsupportedOperationError';
  }
}

export class InvalidExpressionError extends ValidationError {
  constructor(reason: string) {
    super(`Invalid expression: ${reason}`);
    this.name = 'InvalidExpressionError';
  }
}
