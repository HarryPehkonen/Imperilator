export type FractionDenominator = 8 | 16 | 32;

export interface InputValue {
  whole: number;
  numerator: number;
  denominator: FractionDenominator;
}

export interface ScalarValue {
  value: string;
}

export interface MeasurementInput {
  scalar: ScalarValue;
  feet: InputValue;
  inches: InputValue;
}

export type AppState = 'Input' | 'Imperial' | 'Scalar';

export type Operator = '=' | '+' | '-' | 'x' | '/';

export interface StateMachine {
  currentState: AppState;
  displayValue: string;
  errorMessage?: string;
}

// Token-based architecture types
export interface InputToken {
  pad: "Feet" | "Inches" | "Scalar" | "Operator" | "Control";
  key: string; // "1", "2", "1/2", "3/4", "=", "+", "Clear", "Backspace", ".", etc.
}

export interface AppStateComplete {
  currentState: AppState;
  measurements: MeasurementInput;
  activePad: keyof MeasurementInput | null;
  fractionDenominator: FractionDenominator;
  displayValue: string;
  errorTimeout?: number;
}

export interface TokenProcessorResult {
  state: AppStateComplete;
  tokens: InputToken[];
}

// Math Token System
export interface ImperialToken {
  type: "Imperial";
  feet: number;
  inches: number;
  numerator: number;
  denominator: number;
}

export interface ScalarToken {
  type: "Scalar";
  value: string; // Keep as string to preserve decimals like "3.14"
}

export interface OperatorToken {
  type: "Operator";
  operator: Operator;
}

export interface LengthSolutionToken {
  type: "Length";
  totalInches: number; // For calculations
  feet: number;
  inches: number;
  numerator: number;
  denominator: number;
}

export interface AreaSolutionToken {
  type: "Area";
  totalSquareInches: number;
  displayValue: string; // "50 sq.in", "2 sq.ft 4 sq.in"
}

export interface VolumeSolutionToken {
  type: "Volume";
  totalCubicInches: number;
  displayValue: string; // "120 cu.in", "1 cu.ft 24 cu.in"
}

export interface ScalarSolutionToken {
  type: "ScalarSolution";
  value: string;
}

export type MathToken = ImperialToken | ScalarToken | OperatorToken | LengthSolutionToken | AreaSolutionToken | VolumeSolutionToken | ScalarSolutionToken;

