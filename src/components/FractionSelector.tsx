import React from 'react';
import type { FractionDenominator } from '../types';

interface FractionSelectorProps {
  selectedDenominator: FractionDenominator;
  onChange: (denominator: FractionDenominator) => void;
}

export const FractionSelector: React.FC<FractionSelectorProps> = ({
  selectedDenominator,
  onChange,
}) => {
  const denominators: FractionDenominator[] = [8, 16, 32];

  return (
    <div className="fraction-selector">
      <div className="selector-buttons">
        {denominators.map(denominator => (
          <button
            key={denominator}
            onClick={() => onChange(denominator)}
            className={`selector-btn ${selectedDenominator === denominator ? 'active' : ''}`}
          >
            1/{denominator}
          </button>
        ))}
      </div>
    </div>
  );
};