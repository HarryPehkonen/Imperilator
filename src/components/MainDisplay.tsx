import React from 'react';

interface CalculationHistoryItem {
  expression: string;
  result: string;
}

interface MainDisplayProps {
  value: string;
  history?: CalculationHistoryItem[];
}

export const MainDisplay: React.FC<MainDisplayProps> = ({ value, history = [] }) => {
  return (
    <div className="main-display">
      <div className="display-screen">
        {/* Show calculation history */}
        {history.map((item, index) => (
          <div key={index} className="history-line">
            <span className="expression">{item.expression}</span>
            <span className="result"> = {item.result}</span>
          </div>
        ))}
        
        {/* Show current input */}
        {value && (
          <div className="current-line">
            {value}
          </div>
        )}
      </div>
    </div>
  );
};