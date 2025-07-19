import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NumericPad } from './NumericPad';
import type { InputValue } from '../types';

describe('NumericPad', () => {
  const defaultValue: InputValue = {
    whole: 0,
    numerator: 0,
    denominator: 16,
  };

  test('renders number buttons 0-9', () => {
    const onNumberClick = vi.fn();
    render(
      <NumericPad
        value={defaultValue}
        onChange={vi.fn()}
        label="Test"
        onNumberClick={onNumberClick}
      />
    );

    // Check all number buttons are present
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
  });

  test('calls onNumberClick when number button is clicked', () => {
    const onNumberClick = vi.fn();
    render(
      <NumericPad
        value={defaultValue}
        onChange={vi.fn()}
        label="Test"
        onNumberClick={onNumberClick}
      />
    );

    fireEvent.click(screen.getByText('5'));
    expect(onNumberClick).toHaveBeenCalledWith(5);
  });

  test('displays label', () => {
    render(
      <NumericPad
        value={defaultValue}
        onChange={vi.fn()}
        label="Feet"
        onNumberClick={vi.fn()}
      />
    );

    expect(screen.getByText('Feet')).toBeInTheDocument();
  });

  test('renders fraction buttons when showFractions is true', () => {
    const onFractionClick = vi.fn();
    render(
      <NumericPad
        value={defaultValue}
        onChange={vi.fn()}
        label="Test"
        showFractions={true}
        fractionDenominator={8}
        onFractionClick={onFractionClick}
      />
    );

    // Should show simplified fractions: 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8
    expect(screen.getByText('1/8')).toBeInTheDocument();
    expect(screen.getByText('1/4')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('3/4')).toBeInTheDocument();
  });

  test('calls onFractionClick when fraction button is clicked', () => {
    const onFractionClick = vi.fn();
    render(
      <NumericPad
        value={defaultValue}
        onChange={vi.fn()}
        label="Test"
        showFractions={true}
        fractionDenominator={8}
        onFractionClick={onFractionClick}
      />
    );

    fireEvent.click(screen.getByText('1/2'));
    expect(onFractionClick).toHaveBeenCalledWith(4, 8); // 4/8 = 1/2
  });

  test('simplifies fractions correctly', () => {
    const onFractionClick = vi.fn();
    render(
      <NumericPad
        value={defaultValue}
        onChange={vi.fn()}
        label="Test"
        showFractions={true}
        fractionDenominator={16}
        onFractionClick={onFractionClick}
      />
    );

    // 8/16 should be displayed as 1/2
    expect(screen.getByText('1/2')).toBeInTheDocument();
    // 4/16 should be displayed as 1/4
    expect(screen.getByText('1/4')).toBeInTheDocument();
  });

  test('falls back to onChange when onNumberClick is not provided', () => {
    const onChange = vi.fn();
    render(
      <NumericPad
        value={defaultValue}
        onChange={onChange}
        label="Test"
      />
    );

    fireEvent.click(screen.getByText('3'));
    expect(onChange).toHaveBeenCalledWith({
      whole: 3,
      numerator: 0,
      denominator: 16,
    });
  });

  test('handles multiple digit numbers correctly', () => {
    const onChange = vi.fn();
    const currentValue: InputValue = { whole: 1, numerator: 0, denominator: 16 };
    
    render(
      <NumericPad
        value={currentValue}
        onChange={onChange}
        label="Test"
      />
    );

    fireEvent.click(screen.getByText('2'));
    expect(onChange).toHaveBeenCalledWith({
      whole: 12, // 1 * 10 + 2
      numerator: 0,
      denominator: 16,
    });
  });

  test('falls back to onChange when onFractionClick is not provided', () => {
    const onChange = vi.fn();
    render(
      <NumericPad
        value={defaultValue}
        onChange={onChange}
        label="Test"
        showFractions={true}
        fractionDenominator={8}
      />
    );

    fireEvent.click(screen.getByText('1/4'));
    expect(onChange).toHaveBeenCalledWith({
      whole: 0,
      numerator: 2, // 2/8 = 1/4
      denominator: 8,
    });
  });
});