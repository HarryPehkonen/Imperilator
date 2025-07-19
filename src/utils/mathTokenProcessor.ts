import type { InputToken, MathToken, ImperialToken, ScalarToken, MathTokenSystem, AppState } from '../types';

export const createInitialMathTokenSystem = (): MathTokenSystem => ({
  inputTokens: [],
  mathTokens: [],
  displayValue: '',
});

export const processInputTokensToMathTokens = (inputTokens: InputToken[], _currentState: AppState): MathToken[] => {
  const mathTokens: MathToken[] = [];
  let currentImperialToken: ImperialToken | null = null;
  let currentScalarToken: ScalarToken | null = null;
  let lastState: AppState = 'Input';
  
  for (const token of inputTokens) {
    // Skip control tokens for math token generation
    if (token.pad === 'Control') {
      continue;
    }
    
    // Handle state transitions
    determineStateAfterToken(lastState, token);
    
    if (token.pad === 'Operator') {
      // Finalize current tokens before adding operator
      if (currentImperialToken) {
        mathTokens.push(currentImperialToken);
        currentImperialToken = null;
      }
      if (currentScalarToken) {
        mathTokens.push(currentScalarToken);
        currentScalarToken = null;
      }
      
      // Add operator token
      mathTokens.push({
        type: 'Operator',
        operator: token.key as any,
      });
      
      lastState = 'Input';
      continue;
    }
    
    if (token.pad === 'Feet' || token.pad === 'Inches') {
      // Input -> Imperial transition: create new Imperial token
      if (lastState === 'Input') {
        if (currentImperialToken) {
          mathTokens.push(currentImperialToken);
        }
        currentImperialToken = {
          type: 'Imperial',
          feet: 0,
          inches: 0,
          numerator: 0,
          denominator: 16,
        };
        lastState = 'Imperial';
      }
      
      if (currentImperialToken) {
        updateImperialToken(currentImperialToken, token);
      }
    }
    
    if (token.pad === 'Scalar') {
      // Input -> Scalar transition: create new Scalar token
      if (lastState === 'Input') {
        if (currentScalarToken) {
          mathTokens.push(currentScalarToken);
        }
        currentScalarToken = {
          type: 'Scalar',
          value: '',
        };
        lastState = 'Scalar';
      }
      
      if (currentScalarToken) {
        updateScalarToken(currentScalarToken, token);
      }
    }
  }
  
  // Add any remaining tokens
  if (currentImperialToken) {
    mathTokens.push(currentImperialToken);
  }
  if (currentScalarToken) {
    mathTokens.push(currentScalarToken);
  }
  
  return mathTokens;
};

const determineStateAfterToken = (currentState: AppState, token: InputToken): AppState => {
  if (token.pad === 'Operator') {
    return 'Input';
  }
  if (token.pad === 'Feet' || token.pad === 'Inches') {
    return 'Imperial';
  }
  if (token.pad === 'Scalar') {
    return 'Scalar';
  }
  return currentState;
};

const updateImperialToken = (imperialToken: ImperialToken, token: InputToken): void => {
  if (token.key.includes('/')) {
    // It's a fraction - this sets the fraction component
    const [numerator, denominator] = token.key.split('/').map(Number);
    imperialToken.numerator = numerator;
    imperialToken.denominator = denominator;
  } else if (/^\d$/.test(token.key)) {
    // It's a number - this accumulates into the whole number part
    const num = parseInt(token.key);
    if (token.pad === 'Feet') {
      imperialToken.feet = imperialToken.feet * 10 + num;
    } else if (token.pad === 'Inches') {
      // For inches, we accumulate the whole number part
      imperialToken.inches = imperialToken.inches * 10 + num;
    }
  }
};

const updateScalarToken = (scalarToken: ScalarToken, token: InputToken): void => {
  if (token.key === '.') {
    // Only add decimal if one doesn't exist
    if (!scalarToken.value.includes('.')) {
      scalarToken.value += '.';
    }
  } else if (/^\d$/.test(token.key)) {
    // It's a number
    scalarToken.value += token.key;
  }
};

export const buildDisplayFromMathTokens = (mathTokens: MathToken[]): string => {
  if (mathTokens.length === 0) return '';
  
  return mathTokens.map(token => {
    switch (token.type) {
      case 'Imperial':
        return formatImperialToken(token);
      case 'Scalar':
        return token.value || '0';
      case 'Operator':
        return ` ${token.operator} `;
      case 'Length':
        return formatImperialToken(token);
      case 'Area':
        return token.displayValue;
      case 'Volume':
        return token.displayValue;
      case 'ScalarSolution':
        return token.value;
      default:
        return '';
    }
  }).join('');
};

const formatImperialToken = (token: ImperialToken | any): string => {
  const parts: string[] = [];
  
  if (token.feet > 0) {
    parts.push(`${token.feet}ft`);
  }
  
  if (token.inches > 0 || token.numerator > 0) {
    let inchesStr = '';
    if (token.inches > 0) {
      inchesStr += token.inches.toString();
    }
    if (token.numerator > 0) {
      inchesStr += `${token.numerator}/${token.denominator}`;
    }
    if (inchesStr) {
      parts.push(`${inchesStr}in`);
    }
  }
  
  // If no feet or inches, show "0"
  if (parts.length === 0) {
    return '0';
  }
  
  return parts.join(' ');
};

export const removeLastUsefulToken = (mathTokens: MathToken[]): MathToken[] => {
  if (mathTokens.length === 0) return mathTokens;
  
  const newTokens = [...mathTokens];
  const lastToken = newTokens[newTokens.length - 1];
  
  // For Imperial and Scalar tokens, try to backspace within the token first
  if (lastToken.type === 'Imperial') {
    if (canBackspaceImperialToken(lastToken)) {
      backspaceImperialToken(lastToken);
      // Check if token is now empty, if so remove it
      if (!canBackspaceImperialToken(lastToken)) {
        newTokens.pop();
      }
      return newTokens;
    }
  }
  
  if (lastToken.type === 'Scalar') {
    if (canBackspaceScalarToken(lastToken)) {
      backspaceScalarToken(lastToken);
      // Check if token is now empty, if so remove it
      if (!canBackspaceScalarToken(lastToken)) {
        newTokens.pop();
      }
      return newTokens;
    }
  }
  
  // Otherwise, remove the entire token
  newTokens.pop();
  return newTokens;
};

const canBackspaceImperialToken = (token: ImperialToken): boolean => {
  return token.numerator > 0 || token.inches > 0 || token.feet > 0;
};

const backspaceImperialToken = (token: ImperialToken): void => {
  // Priority: most recently entered -> least recently entered
  // Based on user expectation: remove feet first, then inches, then fraction
  if (token.feet > 0) {
    token.feet = Math.floor(token.feet / 10);
  } else if (token.inches > 0) {
    token.inches = Math.floor(token.inches / 10);
  } else if (token.numerator > 0) {
    token.numerator = 0;
    token.denominator = 16;
  }
};

const canBackspaceScalarToken = (token: ScalarToken): boolean => {
  return token.value.length > 0;
};

const backspaceScalarToken = (token: ScalarToken): void => {
  token.value = token.value.slice(0, -1);
};