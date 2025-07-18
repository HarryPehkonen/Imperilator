import { performCalculation } from './mathEngine';
import type { MathToken, ImperialToken, ScalarToken, OperatorToken } from '../types';

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

  const createOperatorToken = (operator: string): OperatorToken => ({
    type: 'Operator',
    operator: operator as any,
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
      totalInches: 26.25, // 18 + 8.25
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
    expect(result.newTokens[0]).toEqual({
      type: 'Length',
      totalInches: 18, // 24 - 6
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
    expect(result.newTokens[0]).toEqual({
      type: 'Length',
      totalInches: 12, // 3 * 4
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
    expect(result.newTokens[0]).toEqual({
      type: 'Area',
      totalSquareInches: 50,
      displayValue: '50.00 sq.in',
    });
  });

  test('should add two scalars', () => {
    const tokens: MathToken[] = [
      createScalarToken('3.14'),
      createOperatorToken('+'),
      createScalarToken('2.86'),
      createOperatorToken('='),
    ];

    const result = performCalculation(tokens);

    expect(result.error).toBeUndefined();
    expect(result.newTokens[0]).toEqual({
      type: 'ScalarSolution',
      value: '6',
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

  test('should handle unsupported operations', () => {
    const tokens: MathToken[] = [
      createImperialToken(1, 0, 0, 16),
      createOperatorToken('/'),
      createImperialToken(2, 0, 0, 16),
      createOperatorToken('='),
    ];

    const result = performCalculation(tokens);

    expect(result.error).toBe('Unsupported operation: Imperial / Imperial');
    expect(result.newTokens).toEqual(tokens);
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
      expect(result.newTokens[0]).toEqual({
        type: 'Length',
        totalInches: 18, // 12 + 6
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
      expect(result.newTokens[0]).toEqual({
        type: 'Length',
        totalInches: 25, // 27 + 18 - 8
        feet: 2,
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
      expect(result.newTokens[0]).toEqual({
        type: 'Length',
        totalInches: 24, // 10 + 12
        feet: 2,
        inches: 0,
        numerator: 0,
        denominator: 1,
      });
    });

    test('should currently fail complex expressions (not yet implemented)', () => {
      const tokens: MathToken[] = [
        createScalarToken('3'),
        createOperatorToken('+'),
        createScalarToken('4'),
        createOperatorToken('x'),
        createScalarToken('2'),
        createOperatorToken('='),
      ];

      const result = performCalculation(tokens);

      expect(result.error).toBe('Complex expressions not yet supported');
    });
  });
});