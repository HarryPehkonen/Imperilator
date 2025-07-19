import { useState, useEffect, useMemo } from 'react';
import { NumericPad } from './components/NumericPad';
import { ScalarPad } from './components/ScalarPad';
import { FractionSelector } from './components/FractionSelector';
import { GlobalControls } from './components/GlobalControls';
import { MainDisplay } from './components/MainDisplay';
import { OperatorButtons } from './components/OperatorButtons';
import { ErrorDisplay } from './components/ErrorDisplay';
import { createInitialState, createToken, processToken } from './utils/tokenProcessor';
import { processInputTokensToMathTokens, buildDisplayFromMathTokens } from './utils/mathTokenProcessor';
import { performCalculation } from './utils/mathEngine';
import type { AppStateComplete, InputToken, FractionDenominator, Operator } from './types';
import './components/NumericPad.css';
import './App.css';

interface CalculationHistoryItem {
  expression: string;
  result: string;
}

function App() {
  const [appState, setAppState] = useState<AppStateComplete>(createInitialState());
  const [usefulTokens, setUsefulTokens] = useState<InputToken[]>([]);
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistoryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  
  // Derive math tokens and display from useful tokens
  const mathTokens = useMemo(() => processInputTokensToMathTokens(usefulTokens), [usefulTokens]);
  const displayValue = useMemo(() => buildDisplayFromMathTokens(mathTokens), [mathTokens]);

  useEffect(() => {
    if (appState.currentState === 'Error') {
      const timeout = setTimeout(() => {
        const token = createToken('Control', 'ErrorTimeout');
        handleToken(token);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [appState.currentState]);

  const handleToken = (token: InputToken) => {
    console.log('Generated token:', token);
    
    // Special handling for error timeout
    if (token.key === 'ErrorTimeout') {
      setAppState(prev => ({
        ...prev,
        currentState: 'Input',
      }));
      return;
    }
    
    // Validate token using the token processor
    const newAppState = processToken(appState, token);
    
    // Check if the token caused an error
    if (newAppState.currentState === 'Error') {
      // Show immediate error feedback for invalid operations
      if (token.pad === 'Operator') {
        setErrorMessage('Cannot enter consecutive operators');
      } else if (token.pad === 'Scalar' && appState.currentState === 'Imperial') {
        setErrorMessage('Cannot mix scalar and Imperial measurements');
      } else {
        setErrorMessage('Invalid operation');
      }
      return; // Don't add the invalid token
    }
    
    // Update app state and add token to useful tokens
    setAppState(newAppState);
    setUsefulTokens(prev => [...prev, token]);
  };

  // Generate tokens for different interactions
  const handleNumberClick = (num: number, padType: 'feet' | 'inches' | 'scalar') => {
    const padMap = {
      feet: 'Feet' as const,
      inches: 'Inches' as const,
      scalar: 'Scalar' as const,
    };
    
    const token = createToken(padMap[padType], num.toString());
    handleToken(token);
  };

  const handleDecimalClick = () => {
    const token = createToken('Scalar', '.');
    handleToken(token);
  };

  const handleFractionClick = (padType: 'feet' | 'inches', numerator: number, denominator: FractionDenominator) => {
    const padMap = {
      feet: 'Feet' as const,
      inches: 'Inches' as const,
    };
    
    const token = createToken(padMap[padType], `${numerator}/${denominator}`);
    handleToken(token);
  };

  const handleOperatorClick = (operator: Operator) => {
    const token = createToken('Operator', operator);
    
    // If it's an equals operator, perform calculation immediately
    if (operator === '=') {
      // Create math tokens with the equals operator included
      const tokensWithEquals = [...usefulTokens, token];
      const mathTokensWithEquals = processInputTokensToMathTokens(tokensWithEquals);
      
      const result = performCalculation(mathTokensWithEquals);
      if (result.error) {
        console.error('Calculation error:', result.error);
        setErrorMessage(result.error);
        return; // Don't update on error
      }
      
      // Get the expression before equals (remove the = token)
      const expressionTokens = mathTokensWithEquals.filter(token => 
        !(token.type === 'Operator' && token.operator === '=')
      );
      const expression = buildDisplayFromMathTokens(expressionTokens);
      const resultDisplay = buildDisplayFromMathTokens(result.newTokens);
      
      // Add to history (keep only last 4 items)
      setCalculationHistory(prevHistory => {
        const newHistory = [
          ...prevHistory,
          { expression, result: resultDisplay }
        ];
        return newHistory.slice(-4); // Keep only last 4 calculations
      });
      
      // Reset for new calculation
      setAppState(createInitialState());
      setUsefulTokens([]);
    } else {
      // For other operators, just add to useful tokens
      handleToken(token);
    }
  };

  const handleClear = () => {
    setUsefulTokens([]);
    setCalculationHistory([]); // Clear history when clearing all
    setAppState(createInitialState());
  };

  const handleBackspace = () => {
    setUsefulTokens(prev => prev.slice(0, -1)); // Simply remove the last token
  };

  const handleFractionDenominatorChange = (denominator: FractionDenominator) => {
    setAppState(prev => ({
      ...prev,
      fractionDenominator: denominator,
      measurements: {
        ...prev.measurements,
        inches: { ...prev.measurements.inches, denominator, numerator: 0 },
      },
    }));
  };

  const handlePadClick = (type: 'feet' | 'inches' | 'scalar') => {
    setAppState(prev => ({
      ...prev,
      activePad: type,
    }));
  };

  // For debugging - expose token history
  const exportTokenHistory = () => {
    console.log('Useful Tokens:', JSON.stringify(usefulTokens, null, 2));
    console.log('Math Tokens:', JSON.stringify(mathTokens, null, 2));
    return { usefulTokens, mathTokens };
  };

  // For testing - process token sequence
  const processTokenSequence = (tokens: InputToken[]) => {
    setUsefulTokens(tokens);
    return { mathTokens: processInputTokensToMathTokens(tokens) };
  };

  // Expose functions for testing
  (window as any).exportTokenHistory = exportTokenHistory;
  (window as any).processTokenSequence = processTokenSequence;

  return (
    <div className={`app ${errorMessage ? 'error-shake' : ''}`}>
      <ErrorDisplay 
        error={errorMessage} 
        onClear={() => setErrorMessage(undefined)} 
      />
      <main className="app-main">
        <MainDisplay 
          value={displayValue} 
          history={calculationHistory}
        />
        
        
        {/* Top row: Feet and Inches side-by-side */}
        <div className="top-pads-compact">
          <div 
            className={`pad-wrapper-compact feet-column ${appState.activePad === 'feet' ? 'active' : ''}`}
            onClick={() => handlePadClick('feet')}
            data-testid="feet-pad"
          >
            <NumericPad
              value={appState.measurements.feet}
              onChange={() => {}}
              label="Feet"
              showFractions={false}
              onNumberClick={(num) => handleNumberClick(num, 'feet')}
            />
          </div>
          
          <div 
            className={`pad-wrapper-compact inches-column ${appState.activePad === 'inches' ? 'active' : ''}`}
            onClick={() => handlePadClick('inches')}
            data-testid="inches-pad"
          >
            <NumericPad
              value={appState.measurements.inches}
              onChange={() => {}}
              label="Inches"
              showFractions={false}
              onNumberClick={(num) => handleNumberClick(num, 'inches')}
            />
          </div>
        </div>

        {/* Fractions row: Full width */}
        <div className="fractions-row">
          <div className="fractions-pad">
            <FractionSelector
              selectedDenominator={appState.fractionDenominator}
              onChange={handleFractionDenominatorChange}
            />
            <div className="fraction-grid">
              {(() => {
                const fractions = [];
                for (let i = 1; i < appState.fractionDenominator; i++) {
                  // Simplify fraction for display
                  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
                  const divisor = gcd(i, appState.fractionDenominator);
                  const simplifiedNum = i / divisor;
                  const simplifiedDen = appState.fractionDenominator / divisor;
                  
                  fractions.push(
                    <button
                      key={i}
                      onClick={() => handleFractionClick('inches', i, appState.fractionDenominator)}
                      className="fraction-btn-compact"
                    >
                      {simplifiedNum}/{simplifiedDen}
                    </button>
                  );
                }
                return fractions;
              })()}
            </div>
          </div>
        </div>

        {/* Bottom row: Scalar + Operators & Controls */}
        <div className="bottom-row">
          <div 
            className={`pad-wrapper-compact ${appState.activePad === 'scalar' ? 'active' : ''}`}
            onClick={() => handlePadClick('scalar')}
            data-testid="scalar-pad"
          >
            <ScalarPad
              value={appState.measurements.scalar}
              onChange={() => {}}
              label="Scalar"
              onNumberClick={(num) => handleNumberClick(num, 'scalar')}
              onDecimalClick={handleDecimalClick}
            />
          </div>

          <div className="controls-section">
            <OperatorButtons onOperatorClick={handleOperatorClick} />
            <GlobalControls
              onClear={handleClear}
              onBackspace={handleBackspace}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;