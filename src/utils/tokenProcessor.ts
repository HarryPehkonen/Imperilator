import type { InputToken, AppStateComplete, FractionDenominator } from '../types';

export const createInitialState = (): AppStateComplete => ({
  currentState: 'Input',
  measurements: {
    scalar: { value: '' },
    feet: { whole: 0, numerator: 0, denominator: 16 },
    inches: { whole: 0, numerator: 0, denominator: 16 },
  },
  activePad: null,
  fractionDenominator: 16,
  displayValue: '',
});

export const processToken = (state: AppStateComplete, token: InputToken): AppStateComplete => {
  console.log('Processing token:', token, 'Current state:', state.currentState);
  
  // Handle Control tokens first
  if (token.pad === 'Control') {
    return processControlToken(state, token);
  }
  
  // Handle Operator tokens
  if (token.pad === 'Operator') {
    return processOperatorToken(state, token);
  }
  
  // Handle input tokens (Feet, Inches, Scalar)
  return processInputToken(state, token);
};

const processControlToken = (state: AppStateComplete, token: InputToken): AppStateComplete => {
  if (token.key === 'Clear') {
    return {
      ...createInitialState(),
      fractionDenominator: state.fractionDenominator,
    };
  }
  
  if (token.key === 'Backspace') {
    return processBackspace(state);
  }
  
  return state;
};

const processOperatorToken = (state: AppStateComplete, _token: InputToken): AppStateComplete => {
  if (state.currentState === 'Input') {
    return {
      ...state,
      currentState: 'Error',
    };
  }
  
  if (state.currentState === 'Imperial' || state.currentState === 'Scalar') {
    return {
      ...state,
      currentState: 'Input',
    };
  }
  
  return state;
};

const processInputToken = (state: AppStateComplete, token: InputToken): AppStateComplete => {
  const newState = { ...state };
  
  if (token.pad === 'Scalar') {
    return processScalarToken(newState, token);
  }
  
  if (token.pad === 'Feet' || token.pad === 'Inches') {
    return processImperialToken(newState, token);
  }
  
  return newState;
};

const processScalarToken = (state: AppStateComplete, token: InputToken): AppStateComplete => {
  // Set active pad
  state.activePad = 'scalar';
  
  // Check for invalid state transition
  if (state.currentState === 'Imperial') {
    return {
      ...state,
      currentState: 'Error',
    };
  }
  
  // Transition to Scalar state if coming from Input
  if (state.currentState === 'Input') {
    state.currentState = 'Scalar';
  }
  
  // Handle the input
  const currentValue = state.measurements.scalar.value;
  
  if (token.key === '.') {
    // Only add decimal if one doesn't exist
    if (!currentValue.includes('.')) {
      state.measurements.scalar.value = currentValue + '.';
    }
  } else if (/^\d$/.test(token.key)) {
    // It's a number
    state.measurements.scalar.value = currentValue + token.key;
  }
  
  return state;
};

const processImperialToken = (state: AppStateComplete, token: InputToken): AppStateComplete => {
  const padType = token.pad.toLowerCase() as 'feet' | 'inches';
  
  // Set active pad
  state.activePad = padType;
  
  // Transition to Imperial state if coming from Input
  if (state.currentState === 'Input') {
    state.currentState = 'Imperial';
  }
  
  // Handle the input
  const currentValue = state.measurements[padType];
  
  if (token.key.includes('/')) {
    // It's a fraction
    const [numerator, denominator] = token.key.split('/').map(Number);
    state.measurements[padType] = {
      ...currentValue,
      numerator,
      denominator: denominator as FractionDenominator,
    };
  } else if (/^\d$/.test(token.key)) {
    // It's a number
    const num = parseInt(token.key);
    const newWhole = currentValue.whole * 10 + num;
    state.measurements[padType] = {
      ...currentValue,
      whole: newWhole,
    };
  }
  
  return state;
};

const processBackspace = (state: AppStateComplete): AppStateComplete => {
  if (!state.activePad) return state;
  
  const newState = { ...state };
  
  if (state.activePad === 'scalar') {
    const currentValue = newState.measurements.scalar.value;
    newState.measurements.scalar.value = currentValue.slice(0, -1);
  } else {
    const currentValue = newState.measurements[state.activePad];
    const newWhole = Math.floor(currentValue.whole / 10);
    newState.measurements[state.activePad] = {
      ...currentValue,
      whole: newWhole,
    };
  }
  
  return newState;
};

export const processTokens = (initialState: AppStateComplete, tokens: InputToken[]): AppStateComplete => {
  return tokens.reduce((state, token) => processToken(state, token), initialState);
};

export const createToken = (pad: InputToken['pad'], key: string): InputToken => ({
  pad,
  key,
});