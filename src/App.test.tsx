import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('State Machine Tests', () => {
  beforeEach(() => {
    render(<App />);
  });

  const getStateIndicator = (state: string) => {
    return screen.getByText(state).previousElementSibling;
  };

  const isStateActive = (state: string) => {
    const indicator = getStateIndicator(state);
    return indicator?.classList.contains('active');
  };

  const clickClearAll = () => {
    fireEvent.click(screen.getByText('Clear All'));
  };

  const clickOperator = (operator: string) => {
    fireEvent.click(screen.getByText(operator));
  };

  const clickFeetPad = () => {
    fireEvent.click(screen.getByText('Feet').closest('.pad-wrapper')!);
  };

  const clickInchesPad = () => {
    fireEvent.click(screen.getByText('Inches').closest('.pad-wrapper')!);
  };

  const clickScalarPad = () => {
    fireEvent.click(screen.getByText('Scalar').closest('.pad-wrapper')!);
  };

  const clickNumber = (num: number) => {
    fireEvent.click(screen.getByText(num.toString()));
  };

  const clickFraction = (numerator: number, denominator: number) => {
    fireEvent.click(screen.getByText(`${numerator}/${denominator}`));
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

  test('Operator from Imperial should go back to Input', () => {
    clickClearAll();
    clickFeetPad();
    clickNumber(5);
    expect(isStateActive('Imperial')).toBe(true);
    
    clickOperator('+');
    expect(isStateActive('Input')).toBe(true);
    expect(isStateActive('Imperial')).toBe(false);
  });

  test('Operator from Scalar should go back to Input', () => {
    clickClearAll();
    clickScalarPad();
    clickNumber(3);
    expect(isStateActive('Scalar')).toBe(true);
    
    clickOperator('x');
    expect(isStateActive('Input')).toBe(true);
    expect(isStateActive('Scalar')).toBe(false);
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
    
    // Hit operator (should go to Input)
    clickOperator('x');
    expect(isStateActive('Input')).toBe(true);
    expect(isStateActive('Scalar')).toBe(false);
    
    // Hit inch button (should go to Imperial)
    clickInchesPad();
    clickNumber(3);
    expect(isStateActive('Imperial')).toBe(true);
    expect(isStateActive('Input')).toBe(false);
    expect(isStateActive('Scalar')).toBe(false);
  });

  test('Error state: Scalar input while in Imperial', () => {
    clickClearAll();
    clickFeetPad();
    clickNumber(5);
    expect(isStateActive('Imperial')).toBe(true);
    
    clickScalarPad();
    clickNumber(3);
    expect(isStateActive('Error')).toBe(true);
    
    // Error should auto-clear after timeout
    setTimeout(() => {
      expect(isStateActive('Input')).toBe(true);
      expect(isStateActive('Error')).toBe(false);
    }, 1600);
  });

  test('Error state: Operator while in Input', () => {
    clickClearAll();
    expect(isStateActive('Input')).toBe(true);
    
    clickOperator('=');
    expect(isStateActive('Error')).toBe(true);
    
    // Error should auto-clear after timeout
    setTimeout(() => {
      expect(isStateActive('Input')).toBe(true);
      expect(isStateActive('Error')).toBe(false);
    }, 1600);
  });

  test('Value persistence: Feet value should persist after state changes', () => {
    clickClearAll();
    clickFeetPad();
    clickNumber(1);
    clickNumber(2);
    
    // Check that feet display shows 12
    const feetDisplay = screen.getByText('Feet').parentElement?.querySelector('.display');
    expect(feetDisplay?.textContent).toBe('12');
    
    // Go to Input via operator
    clickOperator('+');
    expect(isStateActive('Input')).toBe(true);
    
    // Value should still be there
    expect(feetDisplay?.textContent).toBe('12');
  });

  test('Value persistence: Scalar value should persist after state changes', () => {
    clickClearAll();
    clickScalarPad();
    clickNumber(3);
    clickNumber(4);
    
    // Check that scalar display shows 34
    const scalarDisplay = screen.getByText('Scalar').parentElement?.querySelector('.display');
    expect(scalarDisplay?.textContent).toBe('34');
    
    // Go to Input via operator
    clickOperator('-');
    expect(isStateActive('Input')).toBe(true);
    
    // Value should still be there
    expect(scalarDisplay?.textContent).toBe('34');
  });

  test('Decimal button only works on scalar pad', () => {
    clickClearAll();
    clickScalarPad();
    
    // Click decimal button
    fireEvent.click(screen.getByText('.'));
    
    const scalarDisplay = screen.getByText('Scalar').parentElement?.querySelector('.display');
    expect(scalarDisplay?.textContent).toBe('.');
    expect(isStateActive('Scalar')).toBe(true);
  });

  test('Backspace should work on active pad', () => {
    clickClearAll();
    clickScalarPad();
    clickNumber(1);
    clickNumber(2);
    clickNumber(3);
    
    const scalarDisplay = screen.getByText('Scalar').parentElement?.querySelector('.display');
    expect(scalarDisplay?.textContent).toBe('123');
    
    // Click backspace
    fireEvent.click(screen.getByText('⌫ Backspace'));
    
    // Should remove last character
    expect(scalarDisplay?.textContent).toBe('12');
  });
});