import { describe, test, expect } from 'vitest';
import { validateToken, validateTokenSequence } from './validationEngine';
import { createInitialState, createToken } from './tokenProcessor';
import { 
  ConsecutiveOperatorError, 
  MixedTypeError, 
  EmptyExpressionError,
  InvalidExpressionError 
} from './ValidationError';

describe('Validation Engine', () => {
  describe('validateToken', () => {
    test('Control tokens should always be valid', () => {
      const state = createInitialState();
      const token = createToken('Control', 'Clear');
      
      expect(() => validateToken(state, token)).not.toThrow();
    });

    test('Operator from Input state should throw EmptyExpressionError', () => {
      const state = createInitialState();
      const token = createToken('Operator', '+');
      
      expect(() => validateToken(state, token)).toThrow(EmptyExpressionError);
    });

    test('Operator from Imperial state should be valid', () => {
      const state = {
        ...createInitialState(),
        currentState: 'Imperial' as const
      };
      const token = createToken('Operator', '+');
      
      expect(() => validateToken(state, token)).not.toThrow();
    });

    test('Operator from Scalar state should be valid', () => {
      const state = {
        ...createInitialState(),
        currentState: 'Scalar' as const
      };
      const token = createToken('Operator', 'x');
      
      expect(() => validateToken(state, token)).not.toThrow();
    });

    test('Scalar token from Imperial state should throw MixedTypeError', () => {
      const state = {
        ...createInitialState(),
        currentState: 'Imperial' as const
      };
      const token = createToken('Scalar', '5');
      
      expect(() => validateToken(state, token)).toThrow(MixedTypeError);
    });

    test('Scalar token from Input state should be valid', () => {
      const state = createInitialState();
      const token = createToken('Scalar', '5');
      
      expect(() => validateToken(state, token)).not.toThrow();
    });

    test('Scalar token from Scalar state should be valid', () => {
      const state = {
        ...createInitialState(),
        currentState: 'Scalar' as const
      };
      const token = createToken('Scalar', '5');
      
      expect(() => validateToken(state, token)).not.toThrow();
    });

    test('Imperial token from Input state should be valid', () => {
      const state = createInitialState();
      const token = createToken('Feet', '5');
      
      expect(() => validateToken(state, token)).not.toThrow();
    });

    test('Imperial token from Imperial state should be valid', () => {
      const state = {
        ...createInitialState(),
        currentState: 'Imperial' as const
      };
      const token = createToken('Inches', '3');
      
      expect(() => validateToken(state, token)).not.toThrow();
    });
  });

  describe('validateTokenSequence', () => {
    test('Empty sequence should be valid', () => {
      expect(() => validateTokenSequence([])).not.toThrow();
    });

    test('Single token should be valid', () => {
      const tokens = [createToken('Scalar', '5')];
      expect(() => validateTokenSequence(tokens)).not.toThrow();
    });

    test('Valid sequence should not throw', () => {
      const tokens = [
        createToken('Scalar', '5'),
        createToken('Operator', '+'),
        createToken('Feet', '2')
      ];
      expect(() => validateTokenSequence(tokens)).not.toThrow();
    });

    test('Consecutive operators should throw ConsecutiveOperatorError', () => {
      const tokens = [
        createToken('Scalar', '5'),
        createToken('Operator', '+'),
        createToken('Operator', 'x')
      ];
      expect(() => validateTokenSequence(tokens)).toThrow(ConsecutiveOperatorError);
    });

    test('Consecutive operators at start should throw ConsecutiveOperatorError', () => {
      const tokens = [
        createToken('Operator', '+'),
        createToken('Operator', 'x')
      ];
      expect(() => validateTokenSequence(tokens)).toThrow(ConsecutiveOperatorError);
    });
  });

  describe('Error Messages', () => {
    test('ConsecutiveOperatorError should have correct message', () => {
      const error = new ConsecutiveOperatorError();
      expect(error.message).toBe('Cannot enter consecutive operators');
      expect(error.name).toBe('ConsecutiveOperatorError');
    });

    test('MixedTypeError should have correct message', () => {
      const error = new MixedTypeError();
      expect(error.message).toBe('Cannot mix scalar and Imperial measurements');
      expect(error.name).toBe('MixedTypeError');
    });

    test('EmptyExpressionError should have correct message', () => {
      const error = new EmptyExpressionError();
      expect(error.message).toBe("That doesn't make any sense");
      expect(error.name).toBe('EmptyExpressionError');
    });

    test('InvalidExpressionError should have correct message', () => {
      const error = new InvalidExpressionError('test reason');
      expect(error.message).toBe('Invalid expression: test reason');
      expect(error.name).toBe('InvalidExpressionError');
    });
  });
});
