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

  // Handle complex expressions with operator precedence
  return evaluateComplexExpression(tokens);
};

// Shunting Yard Algorithm Implementation
const evaluateComplexExpression = (tokens: MathToken[]): MathToken => {
  // Step 1: Convert infix to postfix using Shunting Yard
  const postfix = infixToPostfix(tokens);
  
  // Step 2: Evaluate postfix expression
  return evaluatePostfix(postfix);
};

const getOperatorPrecedence = (operator: Operator): number => {
  switch (operator) {
    case 'x':
    case '/':
      return 2; // High precedence
    case '+':
    case '-':
      return 1; // Low precedence
    default:
      return 0;
  }
};

const isLeftAssociative = (operator: Operator): boolean => {
  // All our operators are left-associative
  return true;
};

const infixToPostfix = (tokens: MathToken[]): MathToken[] => {
  const output: MathToken[] = [];
  const operatorStack: OperatorToken[] = [];
  
  for (const token of tokens) {
    if (token.type === 'Imperial' || token.type === 'Scalar') {
      // Operands go directly to output
      output.push(token);
    } else if (token.type === 'Operator') {
      const currentOp = token as OperatorToken;
      const currentPrec = getOperatorPrecedence(currentOp.operator);
      
      // Pop operators with higher or equal precedence (for left-associative)
      while (
        operatorStack.length > 0 &&
        getOperatorPrecedence(operatorStack[operatorStack.length - 1].operator) >= currentPrec &&
        isLeftAssociative(currentOp.operator)
      ) {
        output.push(operatorStack.pop()!);
      }
      
      // Push current operator to stack
      operatorStack.push(currentOp);
    }
  }
  
  // Pop remaining operators
  while (operatorStack.length > 0) {
    output.push(operatorStack.pop()!);
  }
  
  return output;
};

const evaluatePostfix = (postfix: MathToken[]): MathToken => {
  const stack: MathToken[] = [];
  
  for (const token of postfix) {
    if (token.type === 'Imperial' || token.type === 'Scalar') {
      // Operands go on the stack
      stack.push(token);
    } else if (token.type === 'Operator') {
      // Pop two operands and apply operator
      if (stack.length < 2) {
        throw new Error('Invalid expression: not enough operands');
      }
      
      const right = stack.pop()!;
      const left = stack.pop()!;
      const operator = (token as OperatorToken).operator;
      
      const result = evaluateBinaryOperation(left, operator, right);
      stack.push(result);
    }
  }
  
  if (stack.length !== 1) {
    throw new Error('Invalid expression: incorrect number of operands');
  }
  
  return stack[0];
};

const evaluateBinaryOperation = (left: MathToken, operator: Operator, right: MathToken): MathToken => {
  const leftType = left.type;
  const rightType = right.type;

  // Convert solution tokens to their base types for operations
  const leftToken = convertSolutionTokenToBase(left);
  const rightToken = convertSolutionTokenToBase(right);
  const leftBaseType = leftToken.type;
  const rightBaseType = rightToken.type;

  // Length + Length = Length
  if ((leftBaseType === 'Imperial' || leftBaseType === 'Length') && 
      (rightBaseType === 'Imperial' || rightBaseType === 'Length') && 
      operator === '+') {
    return addLengths(leftToken as ImperialToken, rightToken as ImperialToken);
  }

  // Length - Length = Length
  if ((leftBaseType === 'Imperial' || leftBaseType === 'Length') && 
      (rightBaseType === 'Imperial' || rightBaseType === 'Length') && 
      operator === '-') {
    return subtractLengths(leftToken as ImperialToken, rightToken as ImperialToken);
  }

  // Scalar × Length = Length
  if ((leftBaseType === 'Scalar' || leftBaseType === 'ScalarSolution') && 
      (rightBaseType === 'Imperial' || rightBaseType === 'Length') && 
      operator === 'x') {
    return multiplyScalarByLength(leftToken as ScalarToken, rightToken as ImperialToken);
  }

  // Length × Scalar = Length
  if ((leftBaseType === 'Imperial' || leftBaseType === 'Length') && 
      (rightBaseType === 'Scalar' || rightBaseType === 'ScalarSolution') && 
      operator === 'x') {
    return multiplyScalarByLength(rightToken as ScalarToken, leftToken as ImperialToken);
  }

  // Length × Length = Area
  if ((leftBaseType === 'Imperial' || leftBaseType === 'Length') && 
      (rightBaseType === 'Imperial' || rightBaseType === 'Length') && 
      operator === 'x') {
    return multiplyLengths(leftToken as ImperialToken, rightToken as ImperialToken);
  }

  // Area × Length = Volume
  if (leftType === 'Area' && 
      (rightBaseType === 'Imperial' || rightBaseType === 'Length') && 
      operator === 'x') {
    return multiplyAreaByLength(left as any, rightToken as ImperialToken);
  }

  // Length × Area = Volume
  if ((leftBaseType === 'Imperial' || leftBaseType === 'Length') && 
      rightType === 'Area' && 
      operator === 'x') {
    return multiplyAreaByLength(right as any, leftToken as ImperialToken);
  }

  // Scalar operations
  if ((leftBaseType === 'Scalar' || leftBaseType === 'ScalarSolution') && 
      (rightBaseType === 'Scalar' || rightBaseType === 'ScalarSolution')) {
    return evaluateScalarOperation(leftToken as ScalarToken, operator, rightToken as ScalarToken);
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

const multiplyAreaByLength = (area: any, length: ImperialToken): any => {
  const lengthInches = imperialToInches(length);
  const totalCubicInches = area.totalSquareInches * lengthInches;
  
  return {
    type: 'Volume',
    totalCubicInches,
    displayValue: formatCubicInches(totalCubicInches),
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

const formatCubicInches = (cubicInches: number): string => {
  const cuFeet = Math.floor(cubicInches / 1728); // 1728 cu in = 1 cu ft
  const remainingCuInches = cubicInches - (cuFeet * 1728);
  
  const parts: string[] = [];
  if (cuFeet > 0) {
    parts.push(`${cuFeet} cu.ft`);
  }
  if (remainingCuInches > 0) {
    parts.push(`${remainingCuInches.toFixed(2)} cu.in`);
  }
  
  return parts.length > 0 ? parts.join(' ') : '0 cu.in';
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

// Convert solution tokens back to their base types for operations
const convertSolutionTokenToBase = (token: MathToken): MathToken => {
  switch (token.type) {
    case 'Length':
      // Convert Length solution token back to Imperial token
      return {
        type: 'Imperial',
        feet: token.feet,
        inches: token.inches,
        numerator: token.numerator,
        denominator: token.denominator,
      };
    case 'ScalarSolution':
      // Convert ScalarSolution token back to Scalar token
      return {
        type: 'Scalar',
        value: token.value,
      };
    case 'Area':
    case 'Volume':
      // Area and Volume tokens don't convert to base types - they stay as-is
      return token;
    default:
      // Return as-is for Imperial, Scalar, Operator, etc.
      return token;
  }
};