import { createInitialState, processToken, processTokens, createToken } from './tokenProcessor';
import type { InputToken, AppStateComplete } from '../types';

describe('Token Processor', () => {
  let initialState: AppStateComplete;
  
  beforeEach(() => {
    initialState = createInitialState();
  });

  // Helper function to create token sequences
  const createTokenSequence = (tokens: Array<{ pad: InputToken['pad'], key: string }>): InputToken[] => {
    return tokens.map(({ pad, key }) => createToken(pad, key));
  };

  describe('Basic State Transitions', () => {
    test('Initial state should be Input', () => {
      expect(initialState.currentState).toBe('Input');
      expect(initialState.activePad).toBe(null);
    });

    test('Clear should reset to Input state', () => {
      const tokens = createTokenSequence([
        { pad: 'Scalar', key: '5' },
        { pad: 'Control', key: 'Clear' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.currentState).toBe('Input');
      expect(finalState.activePad).toBe(null);
      expect(finalState.measurements.scalar.value).toBe('');
    });

    test('Feet number should go Input -> Imperial (single action)', () => {
      const tokens = createTokenSequence([
        { pad: 'Feet', key: '5' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.currentState).toBe('Imperial');
      expect(finalState.activePad).toBe('feet');
      expect(finalState.measurements.feet.whole).toBe(5);
    });

    test('Inches number should go Input -> Imperial (single action)', () => {
      const tokens = createTokenSequence([
        { pad: 'Inches', key: '3' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.currentState).toBe('Imperial');
      expect(finalState.activePad).toBe('inches');
      expect(finalState.measurements.inches.whole).toBe(3);
    });

    test('Scalar number should go Input -> Scalar', () => {
      const tokens = createTokenSequence([
        { pad: 'Scalar', key: '7' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.currentState).toBe('Scalar');
      expect(finalState.activePad).toBe('scalar');
      expect(finalState.measurements.scalar.value).toBe('7');
    });

    test('Fraction should go Input -> Imperial', () => {
      const tokens = createTokenSequence([
        { pad: 'Inches', key: '1/16' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.currentState).toBe('Imperial');
      expect(finalState.activePad).toBe('inches');
      expect(finalState.measurements.inches.numerator).toBe(1);
      expect(finalState.measurements.inches.denominator).toBe(16);
    });
  });

  describe('Operator Transitions', () => {
    test('Operator from Imperial should go back to Input', () => {
      const tokens = createTokenSequence([
        { pad: 'Feet', key: '5' },
        { pad: 'Operator', key: '+' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.currentState).toBe('Input');
      expect(finalState.measurements.feet.whole).toBe(5); // Value persists
    });

    test('Operator from Scalar should go back to Input', () => {
      const tokens = createTokenSequence([
        { pad: 'Scalar', key: '3' },
        { pad: 'Operator', key: 'x' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.currentState).toBe('Input');
      expect(finalState.measurements.scalar.value).toBe('3'); // Value persists
    });

    test('Operator from Input should trigger Error', () => {
      const tokens = createTokenSequence([
        { pad: 'Operator', key: '=' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.currentState).toBe('Error');
    });
  });

  describe('Complex Sequences', () => {
    test('Complex sequence: Scalar -> Operator -> Imperial', () => {
      const tokens = createTokenSequence([
        { pad: 'Scalar', key: '2' },
        { pad: 'Scalar', key: '5' },
        { pad: 'Operator', key: 'x' },
        { pad: 'Inches', key: '3' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.currentState).toBe('Imperial');
      expect(finalState.activePad).toBe('inches');
      expect(finalState.measurements.scalar.value).toBe('25');
      expect(finalState.measurements.inches.whole).toBe(3);
    });

    test('Complex sequence with fractions', () => {
      const tokens = createTokenSequence([
        { pad: 'Feet', key: '1' },
        { pad: 'Feet', key: '2' },
        { pad: 'Operator', key: '+' },
        { pad: 'Inches', key: '3/4' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.currentState).toBe('Imperial');
      expect(finalState.measurements.feet.whole).toBe(12);
      expect(finalState.measurements.inches.numerator).toBe(3);
      expect(finalState.measurements.inches.denominator).toBe(4);
    });
  });

  describe('Error States', () => {
    test('Error state: Scalar input while in Imperial', () => {
      const tokens = createTokenSequence([
        { pad: 'Feet', key: '5' },
        { pad: 'Scalar', key: '3' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.currentState).toBe('Error');
      expect(finalState.measurements.feet.whole).toBe(5); // Imperial value persists
    });

    test('Error state: Operator while in Input', () => {
      const tokens = createTokenSequence([
        { pad: 'Operator', key: '=' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.currentState).toBe('Error');
    });
  });

  describe('Value Handling', () => {
    test('Multiple digits in feet', () => {
      const tokens = createTokenSequence([
        { pad: 'Feet', key: '1' },
        { pad: 'Feet', key: '2' },
        { pad: 'Feet', key: '3' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.measurements.feet.whole).toBe(123);
    });

    test('Decimal in scalar', () => {
      const tokens = createTokenSequence([
        { pad: 'Scalar', key: '3' },
        { pad: 'Scalar', key: '.' },
        { pad: 'Scalar', key: '1' },
        { pad: 'Scalar', key: '4' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.measurements.scalar.value).toBe('3.14');
    });

    test('Prevent multiple decimals', () => {
      const tokens = createTokenSequence([
        { pad: 'Scalar', key: '3' },
        { pad: 'Scalar', key: '.' },
        { pad: 'Scalar', key: '1' },
        { pad: 'Scalar', key: '.' },
        { pad: 'Scalar', key: '4' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.measurements.scalar.value).toBe('3.14'); // Second decimal ignored
    });
  });

  describe('Backspace Functionality', () => {
    test('Backspace on scalar', () => {
      const tokens = createTokenSequence([
        { pad: 'Scalar', key: '1' },
        { pad: 'Scalar', key: '2' },
        { pad: 'Scalar', key: '3' },
        { pad: 'Control', key: 'Backspace' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.measurements.scalar.value).toBe('12');
    });

    test('Backspace on feet', () => {
      const tokens = createTokenSequence([
        { pad: 'Feet', key: '1' },
        { pad: 'Feet', key: '2' },
        { pad: 'Feet', key: '3' },
        { pad: 'Control', key: 'Backspace' }
      ]);
      
      const finalState = processTokens(initialState, tokens);
      expect(finalState.measurements.feet.whole).toBe(12);
    });
  });

  describe('Token Creation Helper', () => {
    test('createToken should create valid tokens', () => {
      const token = createToken('Scalar', '5');
      expect(token).toEqual({ pad: 'Scalar', key: '5' });
    });

    test('createToken should handle fractions', () => {
      const token = createToken('Inches', '3/4');
      expect(token).toEqual({ pad: 'Inches', key: '3/4' });
    });
  });
});