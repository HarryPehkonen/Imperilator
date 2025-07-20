# Imperilator Technical Details

## Architecture Overview

Imperilator uses a **token-based input system** with **unidirectional data flow** and **React hooks** for state management. The architecture separates concerns into distinct layers:

```
UI Layer → Token Generation → Validation → State Processing → Math Processing → Display
```

### Core Architectural Decisions

1. **Token-Based Processing**: All user inputs are converted to tokens, making the system predictable and testable
2. **Engine-Driven Validation**: Validation logic is centralized in the validation engine, not scattered in UI components
3. **Exception-Based Error Handling**: Uses proper JavaScript exceptions instead of error states
4. **Immutable State Updates**: React state is never mutated directly
5. **Memoized Calculations**: Heavy calculations are memoized using React's `useMemo`

## Directory Structure

```
src/
├── components/           # React components
│   ├── ErrorDisplay.tsx
│   ├── MainDisplay.tsx
│   ├── NumericPad.tsx
│   ├── ScalarPad.tsx
│   ├── FractionSelector.tsx
│   ├── OperatorButtons.tsx
│   └── GlobalControls.tsx
├── utils/               # Core logic
│   ├── tokenProcessor.ts
│   ├── mathTokenProcessor.ts
│   ├── mathEngine.ts
│   ├── validationEngine.ts
│   └── ValidationError.ts
├── types/               # TypeScript definitions
│   └── index.ts
├── App.tsx             # Main application
└── main.tsx           # React entry point
```

## Token System Architecture

### Token Flow Pipeline

```
User Input → InputToken → Validation → ProcessedState → MathToken → Display
```

### Token Types

**InputToken** - Raw user input:
```typescript
interface InputToken {
  pad: "Feet" | "Inches" | "Scalar" | "Operator" | "Control";
  key: string; // "1", "2", "1/2", "+", "Clear", etc.
}
```

**MathToken** - Processed for calculation:
```typescript
type MathToken = ImperialToken | ScalarToken | OperatorToken | SolutionToken;

interface ImperialToken {
  type: "Imperial";
  feet: number;
  inches: number;
  numerator: number;
  denominator: number;
}
```

### Token Generation Pattern

Each UI component generates tokens instead of directly updating state:

```typescript
const handleNumberClick = (num: number, padType: 'feet' | 'inches' | 'scalar') => {
  const padMap = {
    feet: 'Feet' as const,
    inches: 'Inches' as const,
    scalar: 'Scalar' as const,
  };
  
  const token = createToken(padMap[padType], num.toString());
  handleToken(token);
};
```

**Why this works**: Centralized token handling enables consistent validation, testing, and debugging.

## State Management

### App State Structure

```typescript
interface AppStateComplete {
  currentState: 'Input' | 'Imperial' | 'Scalar';
  measurements: {
    scalar: { value: string };
    feet: { whole: number; numerator: number; denominator: number };
    inches: { whole: number; numerator: number; denominator: number };
  };
  activePad: 'scalar' | 'feet' | 'inches' | null;
  fractionDenominator: 8 | 16 | 32;
  displayValue: string;
}
```

### State Processing Pattern

```typescript
const handleToken = (token: InputToken) => {
  try {
    // 1. Validate sequence (consecutive operators)
    const newTokenSequence = [...usefulTokens, token];
    validateTokenSequence(newTokenSequence);
    
    // 2. Validate individual token
    validateToken(appState, token);
    
    // 3. Process token if valid
    const newAppState = processToken(appState, token);
    setAppState(newAppState);
    setUsefulTokens(prev => [...prev, token]);
  } catch (error) {
    setErrorMessage(error.message);
    // Invalid token is rejected, not added
  }
};
```

**Critical Detail**: Validation happens BEFORE state changes. Invalid tokens are never added to the useful tokens array.

## Validation Engine

### Exception-Based Design

Instead of returning error states, the validation engine throws specific exceptions:

```typescript
export class ConsecutiveOperatorError extends ValidationError {
  constructor() {
    super('Cannot enter consecutive operators');
    this.name = 'ConsecutiveOperatorError';
  }
}

export const validateToken = (appState: AppStateComplete, token: InputToken): void => {
  if (token.pad === 'Operator' && appState.currentState === 'Input') {
    throw new EmptyExpressionError();
  }
  // More validation logic...
};
```

### Two-Layer Validation

1. **Sequence Validation**: Checks token sequences (e.g., consecutive operators)
2. **State Validation**: Checks if token is valid for current app state

**Order matters**: Sequence validation runs first because it can detect issues that state validation would miss.

## Error Recovery System

### The Backspace Problem (Major Bug Fixed)

**Original Issue**: When an error occurred, the token wasn't added to `usefulTokens`, but `appState` was still updated. Backspace only removed from `usefulTokens` but didn't update `appState`.

**Solution**: Backspace now rebuilds the entire app state from remaining tokens:

```typescript
const handleBackspace = () => {
  setUsefulTokens(prev => {
    const newTokens = prev.slice(0, -1);
    // Rebuild app state from remaining tokens
    const newAppState = newTokens.reduce((state, token) => {
      return processToken(state, token);
    }, createInitialState());
    setAppState(newAppState);
    return newTokens;
  });
  setErrorMessage(undefined); // Clear errors
};
```

**Why this works**: The app state is always consistent with the tokens array. No stale state can exist.

## Mathematical Engine

### Dimensional Analysis Implementation

The math engine enforces proper dimensional analysis:

```typescript
const evaluateBinaryOperation = (left: MathToken, operator: string, right: MathToken) => {
  if (left.type === 'Imperial' && right.type === 'Imperial') {
    switch (operator) {
      case '+': return addLengths(left, right);
      case '-': return subtractLengths(left, right);
      case '/': return divideLengths(left, right); // Returns scalar
      // Volume calculation for multiplication
      default: throw new Error(`Unsupported operation: ${operator}`);
    }
  }
  // More type combinations...
};
```

### Division Implementation (Feature Added)

Division was originally missing for Imperial measurements. Added two functions:

```typescript
const divideLengthByScalar = (length: ImperialToken, scalar: ScalarToken): LengthSolutionToken => {
  const scalarValue = parseFloat(scalar.value);
  if (scalarValue === 0) {
    throw new Error("Division by zero");
  }
  const lengthInches = imperialToInches(length);
  const totalInches = lengthInches / scalarValue;
  
  return inchesToLengthSolution(totalInches);
};

const divideLengths = (left: ImperialToken, right: ImperialToken): ScalarSolutionToken => {
  const leftInches = imperialToInches(left);
  const rightInches = imperialToInches(right);
  if (rightInches === 0) {
    throw new Error("Division by zero");
  }
  const result = leftInches / rightInches;
  
  return {
    type: 'ScalarSolution',
    value: result.toString(),
  };
};
```

### Shunting Yard Algorithm

For operator precedence, the engine uses the Shunting Yard algorithm:

```typescript
const precedence = { '+': 1, '-': 1, 'x': 2, '/': 2 };

// Convert infix to postfix notation
const postfix = [];
const operators = [];

for (const token of tokens) {
  if (token.type === 'Operator') {
    while (operators.length > 0 && 
           precedence[operators[operators.length - 1]] >= precedence[token.operator]) {
      postfix.push(operators.pop());
    }
    operators.push(token.operator);
  } else {
    postfix.push(token);
  }
}
```

## Component Design Patterns

### Error Display Component

```typescript
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClear }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setVisible(true);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }

      // Auto-clear after 3 seconds
      const timeout = setTimeout(() => {
        setVisible(false);
        if (onClear) {
          setTimeout(onClear, 300); // Wait for fade animation
        }
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [error, onClear]);

  if (!error) return null;

  return (
    <div className={`error-display ${visible ? 'visible' : ''}`}>
      <div className="error-content">
        <span className="error-icon">⚠️</span>
        <span className="error-message">{error}</span>
      </div>
    </div>
  );
};
```

**Key Features**:
- Haptic feedback for mobile devices
- CSS animations for smooth appearance
- Auto-dismiss with cleanup
- Accessible error announcements

### Memoization Strategy

Display values are memoized to prevent unnecessary recalculations:

```typescript
// These automatically reset when dependencies change
const mathTokens = useMemo(() => processInputTokensToMathTokens(usefulTokens), [usefulTokens]);
const displayValue = useMemo(() => buildDisplayFromMathTokens(mathTokens), [mathTokens]);
```

**Important**: When Clear is pressed, `usefulTokens` changes, which automatically triggers memoization reset. No manual cache clearing needed.

## Testing Architecture

### Test Organization

1. **Unit Tests**: Each utility function
2. **Integration Tests**: Token flow and state management  
3. **Error Recovery Tests**: Comprehensive error scenarios
4. **UI Tests**: Component interactions

### Error Recovery Test Pattern

```typescript
test('4" + / should error, then backspace should remove +, then / should work', async () => {
  // Enter 4"
  const inchesPad = screen.getByTestId('inches-pad');
  fireEvent.click(inchesPad);
  const inchesFourBtn = screen.getAllByText('4')[1]; // Get from inches pad
  fireEvent.click(inchesFourBtn);
  
  // Create error
  fireEvent.click(screen.getByText('+'));
  fireEvent.click(screen.getByText('/'));
  expect(screen.getByText('Cannot enter consecutive operators')).toBeInTheDocument();
  
  // Recover with backspace
  fireEvent.click(screen.getByText('⌫'));
  expect(screen.queryByText('Cannot enter consecutive operators')).not.toBeInTheDocument();
  
  // Verify / now works
  fireEvent.click(screen.getByText('/'));
  expect(screen.queryByText('Cannot enter consecutive operators')).not.toBeInTheDocument();
});
```

### Multiple Button Disambiguation

A key testing challenge: Multiple pads have the same number buttons. Solution:

```typescript
// Get specific button from specific pad
const allFourButtons = screen.getAllByText('4');
const inchesFourBtn = allFourButtons[1]; // inches pad is second
const scalarFourBtn = allFourButtons[2]; // scalar pad is third
```

## TypeScript Configuration

### Strict Type Safety

```typescript
// No implicit any types allowed
interface InputToken {
  pad: "Feet" | "Inches" | "Scalar" | "Operator" | "Control";
  key: string;
}

// Union types for precise state management
type AppState = 'Input' | 'Imperial' | 'Scalar'; // 'Error' was removed
```

### Type Guards and Validation

```typescript
const isImperialToken = (token: MathToken): token is ImperialToken => {
  return token.type === 'Imperial';
};
```

## Progressive Web App Implementation

### Service Worker Strategy

Generated by Vite PWA plugin with:
- **Precaching**: All static assets cached on install
- **Network-first**: API calls (none in this app)
- **Cache-first**: Static assets for fast loading

### Manifest Configuration

```json
{
  "name": "Imperilator",
  "short_name": "Imperilator",
  "display": "standalone",
  "start_url": "/",
  "theme_color": "#1976d2",
  "background_color": "#ffffff"
}
```

## Build and Development

### Vite Configuration

```typescript
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
  }
});
```

### Test Configuration

Coverage thresholds ensure quality:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'lcov', 'html'],
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

## Key Learnings and Bug Fixes

### 1. The Error State Anti-Pattern

**Original Approach**: Used an `Error` state in the state machine
**Problem**: UI had to check for error states everywhere
**Solution**: Engine-driven validation with exceptions

### 2. The Backspace Consistency Bug

**Problem**: App state and token array could get out of sync after errors
**Solution**: Always rebuild app state from token array on backspace

### 3. The Validation Order Bug  

**Problem**: Individual token validation ran before sequence validation
**Result**: Wrong error messages (EmptyExpression instead of ConsecutiveOperator)
**Solution**: Check sequences first, then individual tokens

### 4. The CSS Overwrite Bug

**Problem**: Accidentally overwrote entire CSS file instead of appending
**Solution**: Always read existing file first when editing

### 5. The Division Missing Feature

**Problem**: Imperial division wasn't implemented
**Solution**: Added both Length÷Scalar and Length÷Length operations

## Performance Considerations

While not a primary concern, the app uses several optimization patterns:

1. **Memoization**: Heavy calculations cached
2. **Minimal re-renders**: State changes only trigger necessary updates  
3. **Event delegation**: No individual button listeners
4. **Debounced validation**: Input validation happens once per token

## Future Extension Points

The architecture supports easy extension:

1. **New Token Types**: Add to InputToken union
2. **New Operations**: Extend math engine switch statements
3. **New Validation Rules**: Add to validation engine
4. **New Display Formats**: Extend display processing

The token-based architecture makes the system highly extensible while maintaining type safety and predictable behavior.