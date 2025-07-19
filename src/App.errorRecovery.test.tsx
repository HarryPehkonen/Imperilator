import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('Error Recovery Tests', () => {
  beforeEach(() => {
    render(<App />);
  });

  test('4" + / should error, then backspace should remove +, then / should work', async () => {
    // Click on inches pad first to ensure we're in the right context
    const inchesPad = screen.getByTestId('inches-pad');
    fireEvent.click(inchesPad);
    
    // Enter 4" - get the 4 button from the inches pad
    const allFourButtons = screen.getAllByText('4');
    const inchesFourBtn = allFourButtons[1]; // inches pad is the second one
    fireEvent.click(inchesFourBtn);
    
    // Add + operator
    const plusBtn = screen.getByText('+');
    fireEvent.click(plusBtn);
    
    // Try to add / (this should trigger an error - consecutive operators)
    const divideBtn = screen.getByText('/');
    fireEvent.click(divideBtn);
    
    // Should see error message
    const errorDisplay = screen.getByText('Cannot enter consecutive operators');
    expect(errorDisplay).toBeInTheDocument();
    
    // Now press backspace to remove the + operator
    const backspaceBtn = screen.getByText('⌫');
    fireEvent.click(backspaceBtn);
    
    // Error should be gone
    expect(screen.queryByText('Cannot enter consecutive operators')).not.toBeInTheDocument();
    
    // Now / should work (no more consecutive operators)
    fireEvent.click(divideBtn);
    
    // Should not show error
    expect(screen.queryByText('Cannot enter consecutive operators')).not.toBeInTheDocument();
    
    // Display should show "4" / " (4" divided by something)
    const displayScreen = document.querySelector('.display-screen');
    expect(displayScreen?.textContent).toContain('4');
    expect(displayScreen?.textContent).toContain('/');
  });

  test('Should be able to continue after consecutive operator error and backspace', async () => {
    // Enter 5 (scalar)
    const scalarPad = screen.getByTestId('scalar-pad');
    fireEvent.click(scalarPad);
    
    // Get the 5 button from scalar pad (third one)
    const allFiveButtons = screen.getAllByText('5');
    const scalarFiveBtn = allFiveButtons[2]; // scalar pad is the third one
    fireEvent.click(scalarFiveBtn);
    
    // Add + operator
    const plusBtn = screen.getByText('+');
    fireEvent.click(plusBtn);
    
    // Try to add x (multiplication) - should error
    const multiplyBtn = screen.getByText('x');
    fireEvent.click(multiplyBtn);
    
    // Should see error
    expect(screen.getByText('Cannot enter consecutive operators')).toBeInTheDocument();
    
    // Backspace to remove the +
    const backspaceBtn = screen.getByText('⌫');
    fireEvent.click(backspaceBtn);
    
    // Now x should work
    fireEvent.click(multiplyBtn);
    
    // Should not show error
    expect(screen.queryByText('Cannot enter consecutive operators')).not.toBeInTheDocument();
    
    // Should be able to continue with calculation
    const inchesPad = screen.getByTestId('inches-pad');
    fireEvent.click(inchesPad);
    
    // Get the 2 button from inches pad
    const allTwoButtons = screen.getAllByText('2');
    const inchesTwoBtn = allTwoButtons[1]; // inches pad is the second one
    fireEvent.click(inchesTwoBtn);
    
    // Should show "5 x 2""
    const displayScreen = document.querySelector('.display-screen');
    expect(displayScreen?.textContent).toContain('5');
    expect(displayScreen?.textContent).toContain('x');
    expect(displayScreen?.textContent).toContain('2');
  });

  test('Mixed type error: Imperial then Scalar should show error', async () => {
    // Enter 5' (feet)
    const feetPad = screen.getByTestId('feet-pad');
    fireEvent.click(feetPad);
    
    const allFiveButtons = screen.getAllByText('5');
    const feetFiveBtn = allFiveButtons[0]; // feet pad is the first one
    fireEvent.click(feetFiveBtn);
    
    // Try to enter scalar value - should error
    const scalarPad = screen.getByTestId('scalar-pad');
    fireEvent.click(scalarPad);
    
    const allThreeButtons = screen.getAllByText('3');
    const scalarThreeBtn = allThreeButtons[2]; // scalar pad is the third one
    fireEvent.click(scalarThreeBtn);
    
    // Should see mixed type error
    expect(screen.getByText('Cannot mix scalar and Imperial measurements')).toBeInTheDocument();
    
    // Backspace should remove the feet value and clear error
    const backspaceBtn = screen.getByText('⌫');
    fireEvent.click(backspaceBtn);
    
    // Error should be gone
    expect(screen.queryByText('Cannot mix scalar and Imperial measurements')).not.toBeInTheDocument();
    
    // Now scalar should work
    fireEvent.click(scalarThreeBtn);
    
    // Display should show just "3"
    const displayScreen = document.querySelector('.display-screen');
    expect(displayScreen?.textContent).toBe('3');
  });

  test('Empty expression error: Operator first should show error', async () => {
    // Try to enter + without any number - should error
    const plusBtn = screen.getByText('+');
    fireEvent.click(plusBtn);
    
    // Should see empty expression error
    expect(screen.getByText("That doesn't make any sense")).toBeInTheDocument();
    
    // Now enter a number
    const scalarPad = screen.getByTestId('scalar-pad');
    fireEvent.click(scalarPad);
    
    const allFiveButtons = screen.getAllByText('5');
    const scalarFiveBtn = allFiveButtons[2];
    fireEvent.click(scalarFiveBtn);
    
    // Error should auto-clear and number should appear
    // Wait for error to clear (it has a 3-second timer)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const displayScreen = document.querySelector('.display-screen');
    expect(displayScreen?.textContent).toContain('5');
  });

  test('Multiple consecutive operators should each trigger error', async () => {
    // Enter 7
    const scalarPad = screen.getByTestId('scalar-pad');
    fireEvent.click(scalarPad);
    
    const allSevenButtons = screen.getAllByText('7');
    const scalarSevenBtn = allSevenButtons[2];
    fireEvent.click(scalarSevenBtn);
    
    // Add +
    const plusBtn = screen.getByText('+');
    fireEvent.click(plusBtn);
    
    // Try -, should error
    const minusBtn = screen.getByText('-');
    fireEvent.click(minusBtn);
    expect(screen.getByText('Cannot enter consecutive operators')).toBeInTheDocument();
    
    // Try x, should still error
    const multiplyBtn = screen.getByText('x');
    fireEvent.click(multiplyBtn);
    expect(screen.getByText('Cannot enter consecutive operators')).toBeInTheDocument();
    
    // Try /, should still error
    const divideBtn = screen.getByText('/');
    fireEvent.click(divideBtn);
    expect(screen.getByText('Cannot enter consecutive operators')).toBeInTheDocument();
    
    // Backspace to remove the +
    const backspaceBtn = screen.getByText('⌫');
    fireEvent.click(backspaceBtn);
    
    // Now any operator should work
    fireEvent.click(multiplyBtn);
    expect(screen.queryByText('Cannot enter consecutive operators')).not.toBeInTheDocument();
  });

  test('Clear button should clear errors', async () => {
    // Create an error by entering consecutive operators
    const scalarPad = screen.getByTestId('scalar-pad');
    fireEvent.click(scalarPad);
    
    const allNineButtons = screen.getAllByText('9');
    const scalarNineBtn = allNineButtons[2];
    fireEvent.click(scalarNineBtn);
    
    const plusBtn = screen.getByText('+');
    fireEvent.click(plusBtn);
    fireEvent.click(plusBtn); // Second + causes error
    
    expect(screen.getByText('Cannot enter consecutive operators')).toBeInTheDocument();
    
    // Clear should remove everything including error
    const clearBtn = screen.getByText('Clear');
    fireEvent.click(clearBtn);
    
    // Error should be gone
    expect(screen.queryByText('Cannot enter consecutive operators')).not.toBeInTheDocument();
    
    // Display should be empty
    const displayScreen = document.querySelector('.display-screen');
    expect(displayScreen?.textContent).toBe('');
  });

  test('Complex recovery: Multiple errors and corrections', async () => {
    // Start with feet
    const feetPad = screen.getByTestId('feet-pad');
    fireEvent.click(feetPad);
    const allTwoButtons = screen.getAllByText('2');
    fireEvent.click(allTwoButtons[0]);
    
    // Add operator
    const plusBtn = screen.getByText('+');
    fireEvent.click(plusBtn);
    
    // Try another operator (error)
    const multiplyBtn = screen.getByText('x');
    fireEvent.click(multiplyBtn);
    expect(screen.getByText('Cannot enter consecutive operators')).toBeInTheDocument();
    
    // Backspace to fix
    const backspaceBtn = screen.getByText('⌫');
    fireEvent.click(backspaceBtn);
    
    // Add inches
    const inchesPad = screen.getByTestId('inches-pad');
    fireEvent.click(inchesPad);
    const allSixButtons = screen.getAllByText('6');
    fireEvent.click(allSixButtons[1]);
    
    // Try to add scalar (error)
    const scalarPad = screen.getByTestId('scalar-pad');
    fireEvent.click(scalarPad);
    const allFourButtons = screen.getAllByText('4');
    fireEvent.click(allFourButtons[2]);
    expect(screen.getByText('Cannot mix scalar and Imperial measurements')).toBeInTheDocument();
    
    // Backspace twice to remove the 6"
    fireEvent.click(backspaceBtn);
    fireEvent.click(backspaceBtn);
    
    // Now we should be able to add more feet
    fireEvent.click(feetPad);
    const allThreeButtons = screen.getAllByText('3');
    fireEvent.click(allThreeButtons[0]);
    
    // Display should show just "3ft" (we backspaced the operator too)
    const displayScreen = document.querySelector('.display-screen');
    expect(displayScreen?.textContent).toBe('3ft');
  });

  test('Backspace after error with equals should work correctly', async () => {
    // Enter calculation that will work
    const scalarPad = screen.getByTestId('scalar-pad');
    fireEvent.click(scalarPad);
    
    const allEightButtons = screen.getAllByText('8');
    fireEvent.click(allEightButtons[2]);
    
    const divideBtn = screen.getByText('/');
    fireEvent.click(divideBtn);
    
    const allTwoButtons = screen.getAllByText('2');
    fireEvent.click(allTwoButtons[2]);
    
    // Add plus (this is actually valid - not consecutive operators)
    const plusBtn = screen.getByText('+');
    fireEvent.click(plusBtn);
    
    // Now try another operator (this would be an error)
    const minusBtn = screen.getByText('-');
    fireEvent.click(minusBtn);
    expect(screen.getByText('Cannot enter consecutive operators')).toBeInTheDocument();
    
    // Backspace to remove the plus
    const backspaceBtn = screen.getByText('⌫');
    fireEvent.click(backspaceBtn);
    
    // Now we can add a number (this continues the second operand)
    const allFourButtons = screen.getAllByText('4');
    fireEvent.click(allFourButtons[2]);
    
    // Display should show "8 / 24" (the 4 is appended to 2)
    const displayScreen = document.querySelector('.display-screen');
    expect(displayScreen?.textContent).toBe('8 / 24');
  });
});