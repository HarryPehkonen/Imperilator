import type { 
  MathToken, 
  ImperialToken, 
  ScalarToken, 
  OperatorToken, 
  LengthSolutionToken,
  AreaSolutionToken,
  ScalarSolutionToken,
  Operator 
} from '../types';

export interface CalculationResult {
  newTokens: MathToken[];
  error?: string;
}

export const performCalculation = (mathTokens: MathToken[]): CalculationResult => {
  // Find the last equals operator
  const equalsIndex = findLastEqualsOperator(mathTokens);
  
  if (equalsIndex === -1) {
    return { newTokens: mathTokens, error: "No equals operator found" };
  }

  // Extract the expression before the equals
  const expression = mathTokens.slice(0, equalsIndex);
  
  try {
    const result = evaluateExpression(expression);
    // Replace the expression with the result
    const newTokens = [result];
    return { newTokens };
  } catch (error) {
    return { newTokens: mathTokens, error: error instanceof Error ? error.message : "Calculation error" };
  }
};

const findLastEqualsOperator = (tokens: MathToken[]): number => {
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i].type === 'Operator' && (tokens[i] as OperatorToken).operator === '=') {
      return i;
    }
  }
  return -1;
};

const evaluateExpression = (tokens: MathToken[]): MathToken => {
  if (tokens.length === 0) {
    throw new Error("Empty expression");
  }

  // Handle single token
  if (tokens.length === 1) {
    const token = tokens[0];
    if (token.type === 'Imperial') {
      return convertImperialToLengthSolution(token);
    }
    if (token.type === 'Scalar') {
      return convertScalarToScalarSolution(token);
    }
    throw new Error("Invalid single token");
  }

  // Handle binary operations (token operator token)
  if (tokens.length === 3) {
    const [left, operator, right] = tokens;
    
    if (operator.type !== 'Operator') {
      throw new Error("Expected operator in middle position");
    }

    return evaluateBinaryOperation(left, (operator as OperatorToken).operator, right);
  }

  // For now, we only handle simple binary operations
  // TODO: Implement more complex expression parsing
  throw new Error("Complex expressions not yet supported");
};

const evaluateBinaryOperation = (left: MathToken, operator: Operator, right: MathToken): MathToken => {
  const leftType = left.type;
  const rightType = right.type;

  // Length + Length = Length
  if (leftType === 'Imperial' && rightType === 'Imperial' && operator === '+') {
    return addLengths(left as ImperialToken, right as ImperialToken);
  }

  // Length - Length = Length
  if (leftType === 'Imperial' && rightType === 'Imperial' && operator === '-') {
    return subtractLengths(left as ImperialToken, right as ImperialToken);
  }

  // Scalar × Length = Length
  if (leftType === 'Scalar' && rightType === 'Imperial' && operator === 'x') {
    return multiplyScalarByLength(left as ScalarToken, right as ImperialToken);
  }

  // Length × Scalar = Length
  if (leftType === 'Imperial' && rightType === 'Scalar' && operator === 'x') {
    return multiplyScalarByLength(right as ScalarToken, left as ImperialToken);
  }

  // Length × Length = Area
  if (leftType === 'Imperial' && rightType === 'Imperial' && operator === 'x') {
    return multiplyLengths(left as ImperialToken, right as ImperialToken);
  }

  // Scalar operations
  if (leftType === 'Scalar' && rightType === 'Scalar') {
    return evaluateScalarOperation(left as ScalarToken, operator, right as ScalarToken);
  }

  throw new Error(`Unsupported operation: ${leftType} ${operator} ${rightType}`);
};

// Length operations
const addLengths = (left: ImperialToken, right: ImperialToken): LengthSolutionToken => {
  const leftInches = imperialToInches(left);
  const rightInches = imperialToInches(right);
  const totalInches = leftInches + rightInches;
  
  return inchesToLengthSolution(totalInches);
};

const subtractLengths = (left: ImperialToken, right: ImperialToken): LengthSolutionToken => {
  const leftInches = imperialToInches(left);
  const rightInches = imperialToInches(right);
  const totalInches = leftInches - rightInches;
  
  return inchesToLengthSolution(totalInches);
};

const multiplyScalarByLength = (scalar: ScalarToken, length: ImperialToken): LengthSolutionToken => {
  const scalarValue = parseFloat(scalar.value);
  const lengthInches = imperialToInches(length);
  const totalInches = scalarValue * lengthInches;
  
  return inchesToLengthSolution(totalInches);
};

const multiplyLengths = (left: ImperialToken, right: ImperialToken): AreaSolutionToken => {
  const leftInches = imperialToInches(left);
  const rightInches = imperialToInches(right);
  const totalSquareInches = leftInches * rightInches;
  
  return {
    type: 'Area',
    totalSquareInches,
    displayValue: formatSquareInches(totalSquareInches),
  };
};

// Scalar operations
const evaluateScalarOperation = (left: ScalarToken, operator: Operator, right: ScalarToken): ScalarSolutionToken => {
  const leftValue = parseFloat(left.value);
  const rightValue = parseFloat(right.value);
  
  let result: number;
  switch (operator) {
    case '+':
      result = leftValue + rightValue;
      break;
    case '-':
      result = leftValue - rightValue;
      break;
    case 'x':
      result = leftValue * rightValue;
      break;
    case '/':
      if (rightValue === 0) {
        throw new Error("Division by zero");
      }
      result = leftValue / rightValue;
      break;
    default:
      throw new Error(`Unsupported scalar operation: ${operator}`);
  }
  
  return {
    type: 'ScalarSolution',
    value: result.toString(),
  };
};

// Utility functions
const imperialToInches = (imperial: ImperialToken): number => {
  const feetInches = imperial.feet * 12;
  const wholeInches = imperial.inches;
  const fractionInches = imperial.numerator / imperial.denominator;
  
  return feetInches + wholeInches + fractionInches;
};

const inchesToLengthSolution = (totalInches: number): LengthSolutionToken => {
  const feet = Math.floor(totalInches / 12);
  const remainingInches = totalInches - (feet * 12);
  const wholeInches = Math.floor(remainingInches);
  const fractionInches = remainingInches - wholeInches;
  
  // Convert decimal fraction to nearest common fraction
  const { numerator, denominator } = decimalToFraction(fractionInches);
  
  return {
    type: 'Length',
    totalInches,
    feet,
    inches: wholeInches,
    numerator,
    denominator,
  };
};

const decimalToFraction = (decimal: number, maxDenominator: number = 32): { numerator: number, denominator: number } => {
  if (decimal === 0) return { numerator: 0, denominator: 1 };
  
  // Try common denominators: 2, 4, 8, 16, 32
  const commonDenominators = [2, 4, 8, 16, 32];
  
  for (const denom of commonDenominators) {
    if (denom > maxDenominator) break;
    
    const numerator = Math.round(decimal * denom);
    const actualDecimal = numerator / denom;
    
    // If close enough (within 1/64), use this fraction
    if (Math.abs(actualDecimal - decimal) < 1/64) {
      return { numerator, denominator: denom };
    }
  }
  
  // Fallback to 32nds
  const numerator = Math.round(decimal * 32);
  return { numerator, denominator: 32 };
};

const formatSquareInches = (squareInches: number): string => {
  const sqFeet = Math.floor(squareInches / 144); // 144 sq in = 1 sq ft
  const remainingSqInches = squareInches - (sqFeet * 144);
  
  const parts: string[] = [];
  if (sqFeet > 0) {
    parts.push(`${sqFeet} sq.ft`);
  }
  if (remainingSqInches > 0) {
    parts.push(`${remainingSqInches.toFixed(2)} sq.in`);
  }
  
  return parts.length > 0 ? parts.join(' ') : '0 sq.in';
};

// Convert simple tokens to solution tokens
const convertImperialToLengthSolution = (imperial: ImperialToken): LengthSolutionToken => {
  const totalInches = imperialToInches(imperial);
  return inchesToLengthSolution(totalInches);
};

const convertScalarToScalarSolution = (scalar: ScalarToken): ScalarSolutionToken => {
  return {
    type: 'ScalarSolution',
    value: scalar.value,
  };
};