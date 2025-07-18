import React from 'react';
import type { InputValue, FractionDenominator } from '../types';

interface NumericPadProps {
  value: InputValue;
  onChange: (value: InputValue) => void;
  label: string;
  fractionDenominator?: FractionDenominator;
  showFractions?: boolean;
  onNumberClick?: (num: number) => void;
  onFractionClick?: (numerator: number, denominator: FractionDenominator) => void;
}

export const NumericPad: React.FC<NumericPadProps> = ({
  value,
  onChange,
  label,
  fractionDenominator = 16,
  showFractions = false,
  onNumberClick,
  onFractionClick,
}) => {
  const handleNumberClick = (num: number) => {
    if (onNumberClick) {
      onNumberClick(num);
    } else {
      const newWhole = value.whole * 10 + num;
      onChange({ ...value, whole: newWhole });
    }
  };

  const handleFractionClick = (numerator: number) => {
    if (onFractionClick) {
      onFractionClick(numerator, fractionDenominator);
    } else {
      onChange({ ...value, numerator, denominator: fractionDenominator });
    }
  };

  // Helper function to simplify fractions for display
  const simplifyFraction = (numerator: number, denominator: number): { numerator: number, denominator: number } => {
    if (numerator === 0) {
      return { numerator: 0, denominator: 1 };
    }
    
    // Find the greatest common divisor
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b);
    };
    
    const divisor = gcd(Math.abs(numerator), Math.abs(denominator));
    
    return {
      numerator: numerator / divisor,
      denominator: denominator / divisor,
    };
  };

  const renderFractionButtons = () => {
    if (!showFractions) return null;
    
    const fractions = [];
    for (let i = 1; i < fractionDenominator; i++) {
      const simplified = simplifyFraction(i, fractionDenominator);
      fractions.push(
        <button
          key={i}
          onClick={() => handleFractionClick(i)}
          className={`fraction-btn ${value.numerator === i ? 'active' : ''}`}
        >
          {simplified.numerator}/{simplified.denominator}
        </button>
      );
    }
    return fractions;
  };

  return (
    <div className="numeric-pad">
      <div className="pad-header">
        <h3>{label}</h3>
      </div>
      
      <div className="number-grid">
        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
          <button
            key={num}
            onClick={() => handleNumberClick(num)}
            className="number-btn"
          >
            {num}
          </button>
        ))}
        <button onClick={() => handleNumberClick(0)} className="number-btn">0</button>
      </div>
      
      {showFractions && (
        <div className="fraction-grid">
          {renderFractionButtons()}
        </div>
      )}
    </div>
  );
};