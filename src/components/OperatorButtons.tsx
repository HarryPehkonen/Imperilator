import React from 'react';
import type { Operator } from '../types';

interface OperatorButtonsProps {
  onOperatorClick: (operator: Operator) => void;
}

export const OperatorButtons: React.FC<OperatorButtonsProps> = ({ onOperatorClick }) => {
  const mathOperators: Operator[] = ['+', '-', 'x', '/'];
  
  return (
    <div className="operator-buttons">
      <button
        onClick={() => onOperatorClick('=')}
        className="equals-btn"
      >
        =
      </button>
      <div className="operator-grid">
        {mathOperators.map(operator => (
          <button
            key={operator}
            onClick={() => onOperatorClick(operator)}
            className="operator-btn"
          >
            {operator}
          </button>
        ))}
      </div>
    </div>
  );
};