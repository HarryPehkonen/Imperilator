import React from 'react';
import type { Operator } from '../types';

interface OperatorButtonsProps {
  onOperatorClick: (operator: Operator) => void;
}

export const OperatorButtons: React.FC<OperatorButtonsProps> = ({ onOperatorClick }) => {
  const operators: Operator[] = ['=', '+', '-', 'x', '/'];
  
  return (
    <div className="operator-buttons">
      <h4>Operators</h4>
      <div className="operator-grid">
        {operators.map(operator => (
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