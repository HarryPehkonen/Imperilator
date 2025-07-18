import { 
  processInputTokensToMathTokens, 
  buildDisplayFromMathTokens
} from './mathTokenProcessor';
import { createToken } from './tokenProcessor';

describe('Math Token Processor', () => {
  test('should create Imperial token from feet input', () => {
    const inputTokens = [
      createToken('Feet', '5'),
      createToken('Feet', '2'),
    ];
    
    const mathTokens = processInputTokensToMathTokens(inputTokens);
    
    expect(mathTokens).toHaveLength(1);
    expect(mathTokens[0]).toEqual({
      type: 'Imperial',
      feet: 52,
      inches: 0,
      numerator: 0,
      denominator: 16,
    });
  });

  test('should create Imperial token from inches with fraction', () => {
    const inputTokens = [
      createToken('Inches', '3'),
      createToken('Inches', '1/2'),
    ];
    
    const mathTokens = processInputTokensToMathTokens(inputTokens);
    
    expect(mathTokens).toHaveLength(1);
    expect(mathTokens[0]).toEqual({
      type: 'Imperial',
      feet: 0,
      inches: 3,
      numerator: 1,
      denominator: 2,
    });
  });

  test('should create Scalar token from decimal input', () => {
    const inputTokens = [
      createToken('Scalar', '3'),
      createToken('Scalar', '.'),
      createToken('Scalar', '1'),
      createToken('Scalar', '4'),
    ];
    
    const mathTokens = processInputTokensToMathTokens(inputTokens);
    
    expect(mathTokens).toHaveLength(1);
    expect(mathTokens[0]).toEqual({
      type: 'Scalar',
      value: '3.14',
    });
  });

  test('should create separate tokens for Input->Imperial->Input->Imperial', () => {
    const inputTokens = [
      createToken('Feet', '5'),
      createToken('Operator', '+'),
      createToken('Inches', '3'),
      createToken('Inches', '1/4'),
    ];
    
    const mathTokens = processInputTokensToMathTokens(inputTokens);
    
    expect(mathTokens).toHaveLength(3);
    expect(mathTokens[0]).toEqual({
      type: 'Imperial',
      feet: 5,
      inches: 0,
      numerator: 0,
      denominator: 16,
    });
    expect(mathTokens[1]).toEqual({
      type: 'Operator',
      operator: '+',
    });
    expect(mathTokens[2]).toEqual({
      type: 'Imperial',
      feet: 0,
      inches: 3,
      numerator: 1,
      denominator: 4,
    });
  });

  test('should build display from math tokens', () => {
    const mathTokens = [
      {
        type: 'Imperial' as const,
        feet: 5,
        inches: 3,
        numerator: 1,
        denominator: 4,
      },
      {
        type: 'Operator' as const,
        operator: '+' as const,
      },
      {
        type: 'Scalar' as const,
        value: '3.14',
      },
    ];
    
    const display = buildDisplayFromMathTokens(mathTokens);
    expect(display).toBe('5ft 3 1/4in + 3.14');
  });

  test('should handle user reported backspace scenario with simplified architecture', () => {
    // User reported: 2/16, 4", 5', backspace should show "4 1/8in" (simplified) not "2/16in"
    const inputTokens = [
      createToken('Inches', '2/16'),
      createToken('Inches', '4'),
      createToken('Feet', '5'),
    ];
    
    const mathTokens = processInputTokensToMathTokens(inputTokens);
    
    // Should create one Imperial token with all the values
    expect(mathTokens).toHaveLength(1);
    expect(mathTokens[0]).toEqual({
      type: 'Imperial',
      feet: 5,
      inches: 4,
      numerator: 2,
      denominator: 16,
    });
    
    // After backspace (simulate removing last input token)
    const inputTokensAfterBackspace = inputTokens.slice(0, -1); // Remove last token
    const mathTokensAfterBackspace = processInputTokensToMathTokens(inputTokensAfterBackspace);
    
    expect(mathTokensAfterBackspace).toHaveLength(1);
    expect(mathTokensAfterBackspace[0]).toEqual({
      type: 'Imperial',
      feet: 0,
      inches: 4,
      numerator: 2,
      denominator: 16,
    });
    
    const display = buildDisplayFromMathTokens(mathTokensAfterBackspace);
    expect(display).toBe('4 1/8in');
  });

  test('should handle backspace with operator tokens', () => {
    // Test: 4" + 3" backspace backspace - should show "4in -" not "4in + 3in -"
    const inputTokens = [
      createToken('Inches', '4'),
      createToken('Operator', '+'),
      createToken('Inches', '3'),
    ];
    
    const mathTokens = processInputTokensToMathTokens(inputTokens);
    
    // Should have: Imperial(4in), Operator(+), Imperial(3in)
    expect(mathTokens).toHaveLength(3);
    expect(mathTokens[0]).toEqual({
      type: 'Imperial',
      feet: 0,
      inches: 4,
      numerator: 0,
      denominator: 16,
    });
    expect(mathTokens[1]).toEqual({
      type: 'Operator',
      operator: '+',
    });
    expect(mathTokens[2]).toEqual({
      type: 'Imperial',
      feet: 0,
      inches: 3,
      numerator: 0,
      denominator: 16,
    });
    
    // After first backspace (remove 3in token)
    const afterFirstBackspace = inputTokens.slice(0, -1);
    const mathTokensAfterFirstBackspace = processInputTokensToMathTokens(afterFirstBackspace);
    
    expect(mathTokensAfterFirstBackspace).toHaveLength(2);
    expect(mathTokensAfterFirstBackspace[1]).toEqual({
      type: 'Operator',
      operator: '+',
    });
    
    // After second backspace (remove + token)
    const afterSecondBackspace = afterFirstBackspace.slice(0, -1);
    const mathTokensAfterSecondBackspace = processInputTokensToMathTokens(afterSecondBackspace);
    
    expect(mathTokensAfterSecondBackspace).toHaveLength(1);
    expect(mathTokensAfterSecondBackspace[0]).toEqual({
      type: 'Imperial',
      feet: 0,
      inches: 4,
      numerator: 0,
      denominator: 16,
    });
    
    const display = buildDisplayFromMathTokens(mathTokensAfterSecondBackspace);
    expect(display).toBe('4in');
  });

  test('should display total inches in brackets for Length solution tokens', () => {
    // Test length solution token formatting with total inches
    const lengthSolutionToken = {
      type: 'Length' as const,
      totalInches: 30,
      feet: 2,
      inches: 6,
      numerator: 0,
      denominator: 1,
    };
    
    const display = buildDisplayFromMathTokens([lengthSolutionToken]);
    expect(display).toBe('2ft 6in (30in)');
  });

  test('should simplify fractions in display', () => {
    // Test that fractions are simplified in display
    const imperialToken = {
      type: 'Imperial' as const,
      feet: 0,
      inches: 3,
      numerator: 4,
      denominator: 16,
    };
    
    const display = buildDisplayFromMathTokens([imperialToken]);
    expect(display).toBe('3 1/4in'); // 4/16 simplified to 1/4
  });

  test('should display area with total square inches', () => {
    // Test area solution token formatting
    const areaSolutionToken = {
      type: 'Area' as const,
      totalSquareInches: 50,
      displayValue: '50.00 sq.in',
    };
    
    const display = buildDisplayFromMathTokens([areaSolutionToken]);
    expect(display).toBe('50.00 sq.in (50 sq.in)');
  });

  test('should display volume with total cubic inches', () => {
    // Test volume solution token formatting
    const volumeSolutionToken = {
      type: 'Volume' as const,
      totalCubicInches: 120,
      displayValue: '120.00 cu.in',
    };
    
    const display = buildDisplayFromMathTokens([volumeSolutionToken]);
    expect(display).toBe('120.00 cu.in (120 cu.in)');
  });
});