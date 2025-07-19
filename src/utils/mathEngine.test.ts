import { describe, test, expect } from 'vitest';
import { performCalculation } from './mathEngine';
import { ImperialToken, ScalarToken, OperatorToken, MathToken } from '../types';

describe('Math Engine', () => {
  const createImperialToken = (feet: number, inches: number, numerator: number = 0, denominator: number = 16): ImperialToken => ({
    type: 'Imperial',
    feet,
    inches,
    numerator,
    denominator,
  });

  const createScalarToken = (value: string): ScalarToken => ({
    type: 'Scalar',
    value,
  });

  const createOperatorToken = (operator: '+' | '-' | 'x' | '/' | '='): OperatorToken => ({
    type: 'Operator',
    operator,
  });

  test('should add two lengths', () => {
    const tokens: MathToken[] = [
      createImperialToken(1, 6, 0, 16), // 1ft 6in
      createOperatorToken('+'),
      createImperialToken(0, 8, 1, 4),  // 8 1/4in
      createOperatorToken('='),
    ];

    const result = performCalculation(tokens);

    expect(result.error).toBeUndefined();
    expect(result.newTokens).toHaveLength(1);
    expect(result.newTokens[0]).toEqual({
      type: 'Length',
      totalInches: 26.25,
      feet: 2,
      inches: 2,
      numerator: 1,
      denominator: 4,
    });
  });

  test('should subtract two lengths', () => {
    const tokens: MathToken[] = [
      createImperialToken(2, 0, 0, 16), // 2ft
      createOperatorToken('-'),
      createImperialToken(0, 6, 0, 16), // 6in
      createOperatorToken('='),
    ];

    const result = performCalculation(tokens);

    expect(result.error).toBeUndefined();
    expect(result.newTokens).toHaveLength(1);
    expect(result.newTokens[0]).toEqual({
      type: 'Length',
      totalInches: 18,
      feet: 1,
      inches: 6,
      numerator: 0,
      denominator: 1,
    });
  });

  test('should multiply scalar by length', () => {
    const tokens: MathToken[] = [
      createScalarToken('3'),
      createOperatorToken('x'),
      createImperialToken(0, 4, 0, 16), // 4in
      createOperatorToken('='),
    ];

    const result = performCalculation(tokens);

    expect(result.error).toBeUndefined();
    expect(result.newTokens).toHaveLength(1);
    expect(result.newTokens[0]).toEqual({
      type: 'Length',
      totalInches: 12,
      feet: 1,
      inches: 0,
      numerator: 0,
      denominator: 1,
    });
  });

  test('should multiply two lengths for area', () => {
    const tokens: MathToken[] = [
      createImperialToken(0, 5, 0, 16), // 5in
      createOperatorToken('x'),
      createImperialToken(0, 10, 0, 16), // 10in
      createOperatorToken('='),
    ];

    const result = performCalculation(tokens);

    expect(result.error).toBeUndefined();
    expect(result.newTokens).toHaveLength(1);
    expect(result.newTokens[0]).toEqual({
      type: 'Area',
      totalSquareInches: 50,
      displayValue: '50.00 sq.in',
    });
  });

  test('should add two scalars', () => {
    const tokens: MathToken[] = [
      createScalarToken('5.5'),
      createOperatorToken('+'),
      createScalarToken('3.2'),
      createOperatorToken('='),
    ];

    const result = performCalculation(tokens);

    expect(result.error).toBeUndefined();
    expect(result.newTokens).toHaveLength(1);
    expect(result.newTokens[0]).toEqual({
      type: 'ScalarSolution',
      value: '8.7',
    });
  });

  test('should handle division by zero', () => {
    const tokens: MathToken[] = [
      createScalarToken('5'),
      createOperatorToken('/'),
      createScalarToken('0'),
      createOperatorToken('='),
    ];

    const result = performCalculation(tokens);

    expect(result.error).toBe('Division by zero');
    expect(result.newTokens).toEqual(tokens);
  });

  test('should divide Imperial measurements', () => {
    const tokens: MathToken[] = [
      createImperialToken(1, 0, 0, 16), // 1ft
      createOperatorToken('/'),
      createImperialToken(2, 0, 0, 16), // 2ft = 24in
      createOperatorToken('='),
    ];

    const result = performCalculation(tokens);

    expect(result.error).toBeUndefined();
    expect(result.newTokens).toHaveLength(1);
    expect(result.newTokens[0]).toEqual({
      type: 'ScalarSolution',
      value: '0.5',
    });
  });

  test('should divide length by scalar', () => {
    const tokens: MathToken[] = [
      createImperialToken(6, 0, 0, 16), // 6ft = 72 inches
      createOperatorToken('/'),
      createScalarToken('3'),
      createOperatorToken('='),
    ];

    const result = performCalculation(tokens);

    expect(result.error).toBeUndefined();
    expect(result.newTokens).toHaveLength(1);
    expect(result.newTokens[0]).toEqual({
      type: 'Length',
      totalInches: 24,
      feet: 2,
      inches: 0,
      numerator: 0,
      denominator: 1,
    });
  });

  test('should handle expressions without equals', () => {
    const tokens: MathToken[] = [
      createScalarToken('5'),
      createOperatorToken('+'),
      createScalarToken('3'),
    ];

    const result = performCalculation(tokens);

    expect(result.error).toBe('No equals operator found');
    expect(result.newTokens).toEqual(tokens);
  });

  test('should handle single token evaluation', () => {
    const tokens: MathToken[] = [
      createImperialToken(1, 6, 1, 4),
      createOperatorToken('='),
    ];

    const result = performCalculation(tokens);

    expect(result.error).toBeUndefined();
    expect(result.newTokens).toHaveLength(1);
    expect(result.newTokens[0]).toEqual({
      type: 'Length',
      totalInches: 18.25,
      feet: 1,
      inches: 6,
      numerator: 1,
      denominator: 4,
    });
  });

  describe('Operator Precedence (Complex Expressions)', () => {
    test('should handle multiplication before addition: 1ft + 3 × 2in = 1ft 6in', () => {
      const tokens: MathToken[] = [
        createImperialToken(1, 0, 0, 16), // 1ft
        createOperatorToken('+'),
        createScalarToken('3'),
        createOperatorToken('x'),
        createImperialToken(0, 2, 0, 16), // 2in
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeUndefined();
      expect(result.newTokens).toHaveLength(1);
      expect(result.newTokens[0]).toEqual({
        type: 'Length',
        totalInches: 18,
        feet: 1,
        inches: 6,
        numerator: 0,
        denominator: 1,
      });
    });

    test('should handle left-to-right for same precedence: 10 - 3 + 2 = 9', () => {
      const tokens: MathToken[] = [
        createScalarToken('10'),
        createOperatorToken('-'),
        createScalarToken('3'),
        createOperatorToken('+'),
        createScalarToken('2'),
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeUndefined();
      expect(result.newTokens).toHaveLength(1);
      expect(result.newTokens[0]).toEqual({
        type: 'ScalarSolution',
        value: '9',
      });
    });

    test('should handle complex length calculation: 2ft 3in + 1ft 6in - 8in = 2ft 1in', () => {
      const tokens: MathToken[] = [
        createImperialToken(2, 3, 0, 16), // 2ft 3in
        createOperatorToken('+'),
        createImperialToken(1, 6, 0, 16), // 1ft 6in
        createOperatorToken('-'),
        createImperialToken(0, 8, 0, 16), // 8in
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeUndefined();
      expect(result.newTokens).toHaveLength(1);
      expect(result.newTokens[0]).toEqual({
        type: 'Length',
        totalInches: 37,
        feet: 3,
        inches: 1,
        numerator: 0,
        denominator: 1,
      });
    });

    test('should handle mixed operations: 2.5 × 4in + 1ft = 2ft', () => {
      const tokens: MathToken[] = [
        createScalarToken('2.5'),
        createOperatorToken('x'),
        createImperialToken(0, 4, 0, 16), // 4in
        createOperatorToken('+'),
        createImperialToken(1, 0, 0, 16), // 1ft
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeUndefined();
      expect(result.newTokens).toHaveLength(1);
      expect(result.newTokens[0]).toEqual({
        type: 'Length',
        totalInches: 22,
        feet: 1,
        inches: 10,
        numerator: 0,
        denominator: 1,
      });
    });

    test('should handle complex scalar expressions: 3 + 4 × 2 = 11', () => {
      const tokens: MathToken[] = [
        createScalarToken('3'),
        createOperatorToken('+'),
        createScalarToken('4'),
        createOperatorToken('x'),
        createScalarToken('2'),
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeUndefined();
      expect(result.newTokens).toHaveLength(1);
      expect(result.newTokens[0]).toEqual({
        type: 'ScalarSolution',
        value: '11',
      });
    });
  });

  describe('Volume Calculations', () => {
    test('should calculate volume: 4in × 3in × 5in = 60 cu.in', () => {
      const tokens: MathToken[] = [
        createImperialToken(0, 4, 0, 16), // 4in
        createOperatorToken('x'),
        createImperialToken(0, 3, 0, 16), // 3in
        createOperatorToken('x'),
        createImperialToken(0, 5, 0, 16), // 5in
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeUndefined();
      expect(result.newTokens).toHaveLength(1);
      expect(result.newTokens[0]).toEqual({
        type: 'Volume',
        totalCubicInches: 60,
        displayValue: '60.00 cu.in',
      });
    });

    test('should calculate volume with feet: 1ft × 2ft × 3ft = 6 cu.ft', () => {
      const tokens: MathToken[] = [
        createImperialToken(1, 0, 0, 16), // 1ft
        createOperatorToken('x'),
        createImperialToken(2, 0, 0, 16), // 2ft
        createOperatorToken('x'),
        createImperialToken(3, 0, 0, 16), // 3ft
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeUndefined();
      expect(result.newTokens).toHaveLength(1);
      expect(result.newTokens[0]).toEqual({
        type: 'Volume',
        totalCubicInches: 10368,
        displayValue: '6 cu.ft',
      });
    });

    test('should handle mixed volume calculation: 6in × 8in × 1ft = 576 cu.in', () => {
      const tokens: MathToken[] = [
        createImperialToken(0, 6, 0, 16), // 6in
        createOperatorToken('x'),
        createImperialToken(0, 8, 0, 16), // 8in
        createOperatorToken('x'),
        createImperialToken(1, 0, 0, 16), // 1ft (12in)
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeUndefined();
      expect(result.newTokens).toHaveLength(1);
      expect(result.newTokens[0]).toEqual({
        type: 'Volume',
        totalCubicInches: 576,
        displayValue: '576.00 cu.in',
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle consecutive operators: 5" * + - =', () => {
      const tokens: MathToken[] = [
        createImperialToken(0, 5, 0, 16), // 5"
        createOperatorToken('x'),
        createOperatorToken('+'),
        createOperatorToken('-'),
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('not enough operands');
    });

    test('should handle operator at start: + 5 =', () => {
      const tokens: MathToken[] = [
        createOperatorToken('+'),
        createScalarToken('5'),
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('not enough operands');
    });

    test('should handle operator at end: 5 + =', () => {
      const tokens: MathToken[] = [
        createScalarToken('5'),
        createOperatorToken('+'),
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('not enough operands');
    });

    test('should handle empty equals: =', () => {
      const tokens: MathToken[] = [
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeDefined();
      expect(result.error).toBe("That doesn't make any sense");
    });

    test('should handle multiple equals: 5 + 3 = 2 =', () => {
      const tokens: MathToken[] = [
        createScalarToken('5'),
        createOperatorToken('+'),
        createScalarToken('3'),
        createOperatorToken('='),
        createScalarToken('2'),
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeDefined();
      expect(result.newTokens).toHaveLength(6); // Returns original tokens on error
      expect(result.newTokens).toEqual(tokens);
    });

    test('should handle mixed types incorrectly: 5ft + 3 (scalar)', () => {
      const tokens: MathToken[] = [
        createImperialToken(5, 0, 0, 16), // 5ft
        createOperatorToken('+'),
        createScalarToken('3'),
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Unsupported operation');
    });

    test('should handle negative results in length subtraction', () => {
      const tokens: MathToken[] = [
        createImperialToken(1, 0, 0, 16), // 1ft
        createOperatorToken('-'),
        createImperialToken(2, 0, 0, 16), // 2ft
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBeUndefined();
      expect(result.newTokens).toHaveLength(1);
      expect(result.newTokens[0]).toEqual({
        type: 'Length',
        totalInches: -12,
        feet: -1,
        inches: 0,
        numerator: 0,
        denominator: 1,
      });
    });
  });
});
