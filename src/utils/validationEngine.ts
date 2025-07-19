import type { InputToken, AppStateComplete } from '../types';
import { 
  ConsecutiveOperatorError, 
  MixedTypeError, 
  EmptyExpressionError,
  InvalidExpressionError 
} from './ValidationError';

export const validateToken = (appState: AppStateComplete, token: InputToken): void => {
  // Handle Control tokens - always valid
  if (token.pad === 'Control') {
    return;
  }
  
  // Handle Operator tokens
  if (token.pad === 'Operator') {
    validateOperatorToken(appState, token);
    return;
  }
  
  // Handle input tokens (Feet, Inches, Scalar)
  validateInputToken(appState, token);
};

const validateOperatorToken = (appState: AppStateComplete, _token: InputToken): void => {
  // Cannot enter operator when in Input state (no measurements entered)
  if (appState.currentState === 'Input') {
    throw new EmptyExpressionError();
  }
  
  // Operators are valid when in Imperial or Scalar states
  if (appState.currentState === 'Imperial' || appState.currentState === 'Scalar') {
    return;
  }
  
  // Any other state is invalid for operators
  throw new InvalidExpressionError('Invalid state for operator');
};

const validateInputToken = (appState: AppStateComplete, token: InputToken): void => {
  if (token.pad === 'Scalar') {
    validateScalarToken(appState, token);
    return;
  }
  
  if (token.pad === 'Feet' || token.pad === 'Inches') {
    validateImperialToken(appState, token);
    return;
  }
};

const validateScalarToken = (appState: AppStateComplete, _token: InputToken): void => {
  // Cannot mix scalar with Imperial measurements
  if (appState.currentState === 'Imperial') {
    throw new MixedTypeError();
  }
  
  // Scalar tokens are valid in Input and Scalar states
  if (appState.currentState === 'Input' || appState.currentState === 'Scalar') {
    return;
  }
  
  throw new InvalidExpressionError('Invalid state for scalar input');
};

const validateImperialToken = (appState: AppStateComplete, _token: InputToken): void => {
  // Imperial tokens are valid in Input and Imperial states
  if (appState.currentState === 'Input' || appState.currentState === 'Imperial') {
    return;
  }
  
  throw new InvalidExpressionError('Invalid state for Imperial input');
};

export const validateTokenSequence = (tokens: InputToken[]): void => {
  if (tokens.length === 0) {
    return;
  }
  
  // Check for consecutive operators
  for (let i = 1; i < tokens.length; i++) {
    const prevToken = tokens[i - 1];
    const currentToken = tokens[i];
    
    if (prevToken.pad === 'Operator' && currentToken.pad === 'Operator') {
      throw new ConsecutiveOperatorError();
    }
  }
  
  // Additional sequence validations can be added here
};