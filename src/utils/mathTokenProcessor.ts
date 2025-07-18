import type { InputToken, MathToken, ImperialToken, ScalarToken, AppState } from '../types';


export const processInputTokensToMathTokens = (inputTokens: InputToken[], _currentState?: AppState): MathToken[] => {
  const mathTokens: MathToken[] = [];
  let currentImperialToken: ImperialToken | null = null;
  let currentScalarToken: ScalarToken | null = null;
  let lastTokenType: 'Input' | 'Imperial' | 'Scalar' = 'Input';
  
  for (const token of inputTokens) {
    // Skip control tokens for math token generation
    if (token.pad === 'Control') {
      continue;
    }
    
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
      
      lastTokenType = 'Input';
      continue;
    }
    
    if (token.pad === 'Feet' || token.pad === 'Inches') {
      // Start new Imperial token or continue existing one
      if (lastTokenType !== 'Imperial') {
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
        lastTokenType = 'Imperial';
      }
      
      if (currentImperialToken) {
        updateImperialToken(currentImperialToken, token);
      }
    }
    
    if (token.pad === 'Scalar') {
      // Start new Scalar token or continue existing one
      if (lastTokenType !== 'Scalar') {
        if (currentScalarToken) {
          mathTokens.push(currentScalarToken);
        }
        currentScalarToken = {
          type: 'Scalar',
          value: '',
        };
        lastTokenType = 'Scalar';
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
        return `${token.displayValue} (${token.totalSquareInches} sq.in)`;
      case 'Volume':
        return `${token.displayValue} (${token.totalCubicInches} cu.in)`;
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
      if (token.inches > 0) {
        inchesStr += ' '; // Add space between inches and fraction
      }
      // Simplify the fraction before displaying
      const simplified = simplifyFraction(token.numerator, token.denominator);
      inchesStr += `${simplified.numerator}/${simplified.denominator}`;
    }
    if (inchesStr) {
      parts.push(`${inchesStr}in`);
    }
  }
  
  // If no feet or inches, show "0"
  if (parts.length === 0) {
    return '0';
  }
  
  let result = parts.join(' ');
  
  // Add total inches in brackets for Length solution tokens
  if (token.type === 'Length' && token.totalInches !== undefined) {
    result += ` (${token.totalInches}in)`;
  }
  
  return result;
};

// Helper function to simplify fractions
const simplifyFraction = (numerator: number, denominator: number): { numerator: number, denominator: number } => {
  if (numerator === 0) {
    return { numerator: 0, denominator: 1 };
  }
  
  // Find the greatest common divisor
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };
  
  const divisor = gcd(Math.abs(numerator), Math.abs(denominator));
  
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
};

