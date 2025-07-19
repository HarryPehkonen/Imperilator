import { useState, useEffect } from 'react';
import { NumericPad } from './components/NumericPad';
import { ScalarPad } from './components/ScalarPad';
import { FractionSelector } from './components/FractionSelector';
import { GlobalControls } from './components/GlobalControls';
import { StateIndicators } from './components/StateIndicators';
import { MainDisplay } from './components/MainDisplay';
import { OperatorButtons } from './components/OperatorButtons';
import { createInitialState, processToken, createToken } from './utils/tokenProcessor';
import { createInitialMathTokenSystem, processInputTokensToMathTokens, buildDisplayFromMathTokens, removeLastUsefulToken } from './utils/mathTokenProcessor';
import type { AppStateComplete, InputToken, FractionDenominator, Operator, MathTokenSystem } from './types';
import './components/NumericPad.css';
import './App.css';

function App() {
  const [appState, setAppState] = useState<AppStateComplete>(createInitialState());
  const [mathTokenSystem, setMathTokenSystem] = useState<MathTokenSystem>(createInitialMathTokenSystem());

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
    
    const newState = processToken(appState, token);
    setAppState(newState);
    
    // Update math token system
    setMathTokenSystem(prev => {
      const newInputTokens = [...prev.inputTokens, token];
      const newMathTokens = processInputTokensToMathTokens(newInputTokens, newState.currentState);
      const newDisplayValue = buildDisplayFromMathTokens(newMathTokens);
      
      return {
        inputTokens: newInputTokens,
        mathTokens: newMathTokens,
        displayValue: newDisplayValue,
      };
    });
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
    handleToken(token);
  };

  const handleClear = () => {
    const token = createToken('Control', 'Clear');
    handleToken(token);
    setMathTokenSystem(createInitialMathTokenSystem());
  };

  const handleBackspace = () => {
    setMathTokenSystem(prev => {
      const newMathTokens = removeLastUsefulToken(prev.mathTokens);
      const newDisplayValue = buildDisplayFromMathTokens(newMathTokens);
      
      // If we removed a token, we need to rebuild inputTokens
      // For now, we'll keep the inputTokens as-is for debugging
      // In a full implementation, we might need to rebuild them
      
      return {
        ...prev,
        mathTokens: newMathTokens,
        displayValue: newDisplayValue,
      };
    });
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
    console.log('Input Tokens:', JSON.stringify(mathTokenSystem.inputTokens, null, 2));
    console.log('Math Tokens:', JSON.stringify(mathTokenSystem.mathTokens, null, 2));
    return { inputTokens: mathTokenSystem.inputTokens, mathTokens: mathTokenSystem.mathTokens };
  };

  // For testing - process token sequence
  const processTokenSequence = (tokens: InputToken[]) => {
    let currentState = createInitialState();
    currentState.fractionDenominator = appState.fractionDenominator;
    
    for (const token of tokens) {
      currentState = processToken(currentState, token);
    }
    
    const newMathTokens = processInputTokensToMathTokens(tokens, currentState.currentState);
    const newDisplayValue = buildDisplayFromMathTokens(newMathTokens);
    
    setAppState(currentState);
    setMathTokenSystem({
      inputTokens: tokens,
      mathTokens: newMathTokens,
      displayValue: newDisplayValue,
    });
    
    return { state: currentState, mathTokens: newMathTokens };
  };

  // Expose functions for testing
  (window as any).exportTokenHistory = exportTokenHistory;
  (window as any).processTokenSequence = processTokenSequence;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Imperilator Input</h1>
        <p>Measurement Input Tool</p>
        <small style={{ color: '#666' }}>
          Input: {mathTokenSystem.inputTokens.length} | Math: {mathTokenSystem.mathTokens.length} | 
          <button onClick={exportTokenHistory} style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
            Export Tokens
          </button>
        </small>
      </header>
      
      <main className="app-main">
        <MainDisplay value={mathTokenSystem.displayValue} />
        
        <StateIndicators currentState={appState.currentState} />
        
        <FractionSelector
          selectedDenominator={appState.fractionDenominator}
          onChange={handleFractionDenominatorChange}
        />
        
        <OperatorButtons onOperatorClick={handleOperatorClick} />
        
        <div className="measurements-section">
          <div className="top-pads">
            <div 
              className={`pad-wrapper ${appState.activePad === 'feet' ? 'active' : ''}`}
              onClick={() => handlePadClick('feet')}
            >
              <NumericPad
                value={appState.measurements.feet}
                onChange={() => {}} // No direct onChange needed
                label="Feet"
                showFractions={false}
                onNumberClick={(num) => handleNumberClick(num, 'feet')}
              />
            </div>
            
            <div 
              className={`pad-wrapper ${appState.activePad === 'inches' ? 'active' : ''}`}
              onClick={() => handlePadClick('inches')}
            >
              <NumericPad
                value={appState.measurements.inches}
                onChange={() => {}} // No direct onChange needed
                label="Inches"
                fractionDenominator={appState.fractionDenominator}
                showFractions={true}
                onNumberClick={(num) => handleNumberClick(num, 'inches')}
                onFractionClick={(numerator, denominator) => handleFractionClick('inches', numerator, denominator)}
              />
            </div>
          </div>
          
          <div className="bottom-pad">
            <div 
              className={`pad-wrapper ${appState.activePad === 'scalar' ? 'active' : ''}`}
              onClick={() => handlePadClick('scalar')}
            >
              <ScalarPad
                value={appState.measurements.scalar}
                onChange={() => {}} // No direct onChange needed
                label="Scalar"
                onNumberClick={(num) => handleNumberClick(num, 'scalar')}
                onDecimalClick={handleDecimalClick}
              />
            </div>
          </div>
        </div>
        
        <GlobalControls
          onClear={handleClear}
          onBackspace={handleBackspace}
        />
      </main>
    </div>
  );
}

export default App;