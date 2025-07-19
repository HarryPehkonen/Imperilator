import React from 'react';
import type { ScalarValue } from '../types';

interface ScalarPadProps {
  value: ScalarValue;
  onChange: (value: ScalarValue) => void;
  label: string;
  onNumberClick?: (num: number) => void;
  onDecimalClick?: () => void;
}

export const ScalarPad: React.FC<ScalarPadProps> = ({
  value,
  onChange,
  label: _label,
  onNumberClick,
  onDecimalClick,
}) => {
  const handleNumberClick = (num: number) => {
    if (onNumberClick) {
      onNumberClick(num);
    } else {
      onChange({ value: value.value + num.toString() });
    }
  };

  const handleDecimalClick = () => {
    if (onDecimalClick) {
      onDecimalClick();
    } else {
      if (!value.value.includes('.')) {
        onChange({ value: value.value + '.' });
      }
    }
  };

  return (
    <div className="numeric-pad">
      <div className="number-grid scalar-grid">
        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
          <button
            key={num}
            onClick={() => handleNumberClick(num)}
            className="number-btn"
          >
            {num}
          </button>
        ))}
        <button onClick={handleDecimalClick} className="decimal-btn">.</button>
        <button onClick={() => handleNumberClick(0)} className="number-btn">0</button>
      </div>
    </div>
  );
};