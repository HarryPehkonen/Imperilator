# Imperilator Requirements

## Overview

Imperilator is a Progressive Web App (PWA) calculator specifically designed for Imperial measurements used in construction and carpentry. It handles feet, inches, fractional inches, and scalar values with proper dimensional analysis.

## Core Functionality

### Input Types

The calculator must support three distinct input types:

1. **Imperial Measurements**
   - Feet (whole numbers only)
   - Inches (whole numbers + fractions)
   - Fractions: 1/8, 1/16, 1/32 (user-selectable denominator)

2. **Scalar Values**
   - Decimal numbers (e.g., 3.14)
   - Whole numbers
   - Single decimal point allowed

3. **Operators**
   - Addition (+)
   - Subtraction (-)
   - Multiplication (x)
   - Division (/)
   - Equals (=)

### Mathematical Operations

#### Supported Operations (Dimensional Analysis)

- **Length + Length = Length**
  - Example: 2ft 3in + 1ft 6in = 3ft 9in

- **Length - Length = Length**
  - Example: 5ft - 2ft 4in = 2ft 8in

- **Length × Scalar = Length**
  - Example: 3ft 6in × 2 = 7ft

- **Scalar × Length = Length**
  - Example: 2 × 3ft 6in = 7ft

- **Length ÷ Scalar = Length**
  - Example: 6ft ÷ 2 = 3ft

- **Length ÷ Length = Scalar**
  - Example: 6ft ÷ 3ft = 2

- **Length × Length = Area**
  - Example: 3ft × 4ft = 12 sq.ft

- **Length × Length × Length = Volume**
  - Example: 2ft × 3ft × 4ft = 24 cu.ft

- **Scalar operations** (all standard math)
  - Example: 5 + 3 = 8, 10 / 2 = 5

#### Unsupported Operations
- Scalar + Length (invalid - different units)
- Scalar - Length (invalid - different units)
- Area + Volume (invalid - different dimensions)
- Any operation that doesn't make dimensional sense

### Display Requirements

1. **Main Display**
   - Shows current expression being built
   - Formats Imperial measurements as: `2ft 3 1/4in`
   - Shows operators with spaces: `2ft + 3in`

2. **Result Display**
   - Shows calculated result after equals
   - Imperial results show total inches in parentheses: `3ft 9in (45in)`
   - Area results: `12 sq.ft`
   - Volume results: `24 cu.ft`

3. **History Display**
   - Shows last 4 calculations
   - Format: `expression = result`
   - Auto-scrolls to show most recent

### User Interface Layout

```
+----------------------------------+
|          Main Display            |
|          History (4)             |
+----------------------------------+
| [Feet Pad]  |  [Inches Pad]      |
| 7 8 9       |  7 8 9             |
| 4 5 6 Feet  |  4 5 6 Inches      |
| 1 2 3       |  1 2 3             |
|   0         |    0               |
+----------------------------------+
|        Fraction Selector         |
|  [8ths] [16ths] [32nds]         |
|  1/16  2/16  3/16 ... 15/16     |
+----------------------------------+
| [Scalar Pad]    | [Operators]    |
| 7 8 9           |     [=]        |
| 4 5 6           |  [+] [-]       |
| 1 2 3           |  [x] [/]       |
| . 0             |                 |
|                 | [Clear] [⌫]     |
+----------------------------------+
```

### Input Validation Rules

1. **State Machine Rules**
   - Calculator has three states: `Input`, `Imperial`, `Scalar`
   - Cannot mix Imperial and Scalar in same number entry
   - After an operator, state resets to `Input`

2. **Token Validation**
   - No consecutive operators (e.g., `+ -` is invalid)
   - Cannot start expression with operator (except for negative numbers - not implemented)
   - Empty expression with equals shows error

3. **Number Entry Rules**
   - Feet: Multiple digits allowed (e.g., 12ft, 123ft)
   - Inches: Multiple digits allowed
   - Scalar: Multiple digits, single decimal point
   - Fractions: Selected from predefined buttons, not typed

### Error Handling

1. **Error Types**
   - `ConsecutiveOperatorError`: "Cannot enter consecutive operators"
   - `MixedTypeError`: "Cannot mix scalar and Imperial measurements"
   - `EmptyExpressionError`: "That doesn't make any sense"
   - `DivisionByZeroError`: "Division by zero"
   - Calculation errors: Various math-related errors

2. **Error Display**
   - Visual feedback: Red error message overlay
   - Haptic feedback: Vibration pattern `[100, 50, 100]` (if supported)
   - Auto-dismiss after 3 seconds
   - Shake animation on app container

3. **Error Recovery**
   - **Backspace**: Removes last token and clears error
   - **Clear**: Resets entire calculator and clears error
   - Invalid tokens are rejected (not added to expression)
   - App state is rebuilt from remaining valid tokens after backspace

### Control Behaviors

1. **Clear Button**
   - Resets all measurements to zero
   - Clears token history
   - Clears calculation history
   - Clears any error messages
   - Returns to `Input` state

2. **Backspace Button**
   - Removes last token from expression
   - Rebuilds app state from remaining tokens
   - Clears error messages
   - Updates display immediately

3. **Equals Button**
   - Evaluates current expression
   - Adds to calculation history
   - Clears current expression for new calculation
   - Shows error if expression is invalid

### Progressive Web App Requirements

1. **Offline Functionality**
   - Full calculator works without internet
   - Service worker caches all assets

2. **Installation**
   - Add to home screen capability
   - Standalone mode (no browser chrome)
   - App icon and splash screen

3. **Responsive Design**
   - Mobile-first design
   - Works on screens 320px and up
   - Touch-optimized buttons

### Edge Cases and Special Behaviors

1. **Fraction Simplification**
   - Display shows simplified fractions (e.g., 2/16 → 1/8)
   - Internal calculations use original precision

2. **Multiple Digit Entry**
   - Feet: 1, 2, 3 → 123ft
   - Scalar: 1, 2, 3 → 123
   - But feet then inches: 1 (feet), 2 (inches) → 1ft 2in

3. **Active Pad Indication**
   - Visual highlight shows which pad is active
   - Clicking a pad makes it active
   - Affects backspace behavior (only active pad affected)

4. **Token Processing Order**
   - Validation happens before state changes
   - Sequence validation (consecutive operators) checked first
   - Individual token validation second

5. **Calculation Precision**
   - Internal calculations in inches for Imperial
   - Floating point for scalars
   - Results rounded appropriately for display

### Testing Requirements

The application must maintain:
- Minimum 80% test coverage
- Tests for all error scenarios
- Tests for all mathematical operations
- Tests for UI interactions and state management
- Error recovery tests