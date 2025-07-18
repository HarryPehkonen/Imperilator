import { 
  processInputTokensToMathTokens, 
  buildDisplayFromMathTokens, 
  removeLastUsefulToken,
  createInitialMathTokenSystem
} from './mathTokenProcessor';
import { createToken } from './tokenProcessor';

describe('Math Token Processor', () => {
  test('should create Imperial token from feet input', () => {
    const inputTokens = [
      createToken('Feet', '5'),
      createToken('Feet', '2'),
    ];
    
    const mathTokens = processInputTokensToMathTokens(inputTokens, 'Imperial');
    
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
    
    const mathTokens = processInputTokensToMathTokens(inputTokens, 'Imperial');
    
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
    
    const mathTokens = processInputTokensToMathTokens(inputTokens, 'Scalar');
    
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
    
    const mathTokens = processInputTokensToMathTokens(inputTokens, 'Imperial');
    
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

  test('should remove last useful token with backspace', () => {
    const mathTokens = [
      {
        type: 'Imperial' as const,
        feet: 5,
        inches: 3,
        numerator: 1,
        denominator: 4,
      },
      {
        type: 'Scalar' as const,
        value: '123',
      },
    ];
    
    const result = removeLastUsefulToken(mathTokens);
    
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      type: 'Scalar',
      value: '12', // Last character removed
    });
  });

  test('should remove entire token when backspace exhausts content', () => {
    const mathTokens = [
      {
        type: 'Imperial' as const,
        feet: 5,
        inches: 0,
        numerator: 0,
        denominator: 16,
      },
      {
        type: 'Scalar' as const,
        value: '1',
      },
    ];
    
    const result = removeLastUsefulToken(mathTokens);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'Imperial',
      feet: 5,
      inches: 0,
      numerator: 0,
      denominator: 16,
    });
  });

  test('should handle complex sequence from user example', () => {
    // 1/2, 2 inches, 4 feet, then backspace should show "2 1/2in"
    const inputTokens = [
      createToken('Inches', '1/2'),
      createToken('Inches', '2'),
      createToken('Feet', '4'),
    ];
    
    const mathTokens = processInputTokensToMathTokens(inputTokens, 'Imperial');
    
    // Should create one Imperial token with all the values
    expect(mathTokens).toHaveLength(1);
    expect(mathTokens[0]).toEqual({
      type: 'Imperial',
      feet: 4,
      inches: 2,
      numerator: 1,
      denominator: 2,
    });
    
    // After backspace (removes feet)
    const afterBackspace = removeLastUsefulToken(mathTokens);
    expect(afterBackspace[0]).toEqual({
      type: 'Imperial',
      feet: 0,
      inches: 2,
      numerator: 1,
      denominator: 2,
    });
    
    const display = buildDisplayFromMathTokens(afterBackspace);
    expect(display).toBe('2 1/2in');
  });
});