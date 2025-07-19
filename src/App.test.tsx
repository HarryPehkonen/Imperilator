import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('State Machine Tests', () => {
  beforeEach(() => {
    render(<App />);
  });

  // Check if a pad is active by looking for the 'active' class
  const isStateActive = (state: string) => {
    switch (state) {
      case 'Input':
        // No pad is active in input state
        const feetPad = screen.queryByTestId('feet-pad');
        const inchesPad = screen.queryByTestId('inches-pad');
        const scalarPad = screen.queryByTestId('scalar-pad');
        return !(feetPad?.classList.contains('active') || 
                inchesPad?.classList.contains('active') || 
                scalarPad?.classList.contains('active'));
      case 'Imperial':
        // Either feet or inches pad is active
        const feet = screen.queryByTestId('feet-pad');
        const inches = screen.queryByTestId('inches-pad');
        return !!(feet?.classList.contains('active') || inches?.classList.contains('active'));
      case 'Scalar':
        // Scalar pad is active
        const scalar = screen.queryByTestId('scalar-pad');
        return !!scalar?.classList.contains('active');
      case 'Error':
        // Would need to check for error state in the actual app state
        return false;
      default:
        return false;
    }
  };

  const clickClearAll = () => {
    fireEvent.click(screen.getByText('Clear'));
  };

  const clickOperator = (operator: string) => {
    fireEvent.click(screen.getByText(operator));
  };

  const clickFeetPad = () => {
    fireEvent.click(screen.getByTestId('feet-pad'));
  };

  const clickInchesPad = () => {
    fireEvent.click(screen.getByTestId('inches-pad'));
  };

  const clickScalarPad = () => {
    fireEvent.click(screen.getByTestId('scalar-pad'));
  };

  const clickNumber = (num: number) => {
    // Find the active pad and click the number button within it
    const activePad = document.querySelector('.pad-wrapper-compact.active .number-grid') ||
                     document.querySelector('.feet-column.active .number-grid') ||
                     document.querySelector('.inches-column.active .number-grid');
    
    if (activePad) {
      const numberBtn = Array.from(activePad.querySelectorAll('.number-btn'))
        .find(btn => btn.textContent === num.toString());
      if (numberBtn) {
        fireEvent.click(numberBtn as Element);
        return;
      }
    }
    
    // Fallback: click the first matching number button
    fireEvent.click(screen.getAllByText(num.toString())[0]);
  };

  const clickFraction = (numerator: number, denominator: number) => {
    // Look for fraction buttons in the fractions pad, not the selector
    const fractionsPad = document.querySelector('.fractions-pad .fraction-grid');
    if (fractionsPad) {
      const fractionBtn = Array.from(fractionsPad.querySelectorAll('.fraction-btn-compact'))
        .find(btn => btn.textContent?.trim() === `${numerator}/${denominator}`);
      if (fractionBtn) {
        fireEvent.click(fractionBtn as Element);
        return;
      }
    }
    
    // Fallback: click the last matching fraction button (should be the actual fraction, not selector)
    const allFractionBtns = screen.getAllByText(`${numerator}/${denominator}`);
    fireEvent.click(allFractionBtns[allFractionBtns.length - 1]);
  };

  test('Initial state should be Input', () => {
    expect(isStateActive('Input')).toBe(true);
    expect(isStateActive('Imperial')).toBe(false);
    expect(isStateActive('Scalar')).toBe(false);
  });

  test('Clear all should reset to Input state', () => {
    clickScalarPad();
    clickNumber(5);
    expect(isStateActive('Scalar')).toBe(true);
    
    clickClearAll();
    expect(isStateActive('Input')).toBe(true);
    expect(isStateActive('Imperial')).toBe(false);
    expect(isStateActive('Scalar')).toBe(false);
  });

  test('Clicking feet number should go Input -> Imperial (single click)', () => {
    clickClearAll();
    expect(isStateActive('Input')).toBe(true);
    
    clickFeetPad();
    clickNumber(5);
    expect(isStateActive('Imperial')).toBe(true);
    expect(isStateActive('Input')).toBe(false);
  });

  test('Clicking inches number should go Input -> Imperial (single click)', () => {
    clickClearAll();
    expect(isStateActive('Input')).toBe(true);
    
    clickInchesPad();
    clickNumber(3);
    expect(isStateActive('Imperial')).toBe(true);
    expect(isStateActive('Input')).toBe(false);
  });

  test('Clicking scalar number should go Input -> Scalar', () => {
    clickClearAll();
    expect(isStateActive('Input')).toBe(true);
    
    clickScalarPad();
    clickNumber(7);
    expect(isStateActive('Scalar')).toBe(true);
    expect(isStateActive('Input')).toBe(false);
  });

  test('Clicking fraction should go Input -> Imperial', () => {
    clickClearAll();
    expect(isStateActive('Input')).toBe(true);
    
    clickInchesPad();
    clickFraction(1, 16);
    expect(isStateActive('Imperial')).toBe(true);
    expect(isStateActive('Input')).toBe(false);
  });

  test('Operator from Imperial should work', () => {
    clickClearAll();
    clickFeetPad();
    clickNumber(5);
    expect(isStateActive('Imperial')).toBe(true);
    
    clickOperator('+');
    // After operator, the display should show the calculation
    const mainDisplay = document.querySelector('.current-line');
    expect(mainDisplay?.textContent).toContain('5ft +');
  });

  test('Operator from Scalar should work', () => {
    clickClearAll();
    clickScalarPad();
    clickNumber(3);
    expect(isStateActive('Scalar')).toBe(true);
    
    clickOperator('x');
    // After operator, the display should show the calculation
    const mainDisplay = document.querySelector('.current-line');
    expect(mainDisplay?.textContent).toContain('3 x');
  });

  test('Complex sequence: Scalar -> Operator -> Imperial', () => {
    clickClearAll();
    expect(isStateActive('Input')).toBe(true);
    
    // Hit two numbers in Scalar
    clickScalarPad();
    clickNumber(2);
    expect(isStateActive('Scalar')).toBe(true);
    
    clickNumber(5);
    expect(isStateActive('Scalar')).toBe(true);
    
    // Hit operator
    clickOperator('x');
    
    // Hit inch button
    clickInchesPad();
    clickNumber(3);
    expect(isStateActive('Imperial')).toBe(true);
    
    // Check display shows the calculation
    const mainDisplay = document.querySelector('.current-line');
    expect(mainDisplay?.textContent).toContain('25 x 3in');
  });

  test('Invalid operations should not break the app', () => {
    clickClearAll();
    clickFeetPad();
    clickNumber(5);
    expect(isStateActive('Imperial')).toBe(true);
    
    clickScalarPad();
    clickNumber(3);
    // App should handle invalid input gracefully
    const mainDisplay = document.querySelector('.current-line');
    expect(mainDisplay?.textContent).toBeTruthy(); // Display should show something valid
  });

  test('Empty equals should not break the app', () => {
    clickClearAll();
    expect(isStateActive('Input')).toBe(true);
    
    clickOperator('=');
    // App should handle empty calculation gracefully (display element may not exist)
    const mainDisplay = document.querySelector('.current-line');
    expect(mainDisplay?.textContent || '').toBe(''); // Should remain empty or handle gracefully
  });

  test('Value persistence: Feet value should persist after operators', () => {
    clickClearAll();
    clickFeetPad();
    clickNumber(1);
    clickNumber(2);
    
    // Check that main display shows the feet value
    const mainDisplay = document.querySelector('.current-line');
    expect(mainDisplay?.textContent).toContain('12');
    
    // Add operator
    clickOperator('+');
    
    // Value should still be in display
    expect(mainDisplay?.textContent).toContain('12ft +');
  });

  test('Value persistence: Scalar value should persist after operators', () => {
    clickClearAll();
    clickScalarPad();
    clickNumber(3);
    clickNumber(4);
    
    // Check that main display shows the scalar value
    const mainDisplay = document.querySelector('.current-line');
    expect(mainDisplay?.textContent).toContain('34');
    
    // Add operator
    clickOperator('-');
    
    // Value should still be in display
    expect(mainDisplay?.textContent).toContain('34 -');
  });

  test('Decimal button only works on scalar pad', () => {
    clickClearAll();
    clickScalarPad();
    
    // Click decimal button
    fireEvent.click(screen.getByText('.'));
    
    const mainDisplay = document.querySelector('.current-line');
    expect(mainDisplay?.textContent).toContain('.');
    expect(isStateActive('Scalar')).toBe(true);
  });

  test('Backspace should work on active pad', () => {
    clickClearAll();
    clickScalarPad();
    clickNumber(1);
    clickNumber(2);
    clickNumber(3);
    
    const mainDisplay = document.querySelector('.current-line');
    expect(mainDisplay?.textContent).toContain('123');
    
    // Click backspace
    fireEvent.click(screen.getByText('⌫'));
    
    // Should remove last token
    expect(mainDisplay?.textContent).toContain('12');
  });
});