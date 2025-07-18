import React, { useEffect, useRef } from 'react';

interface CalculationHistoryItem {
  expression: string;
  result: string;
}

interface MainDisplayProps {
  value: string;
  history?: CalculationHistoryItem[];
}

export const MainDisplay: React.FC<MainDisplayProps> = ({ value, history = [] }) => {
  const displayRef = useRef<HTMLDivElement>(null);
  const prevHistoryLength = useRef(history.length);

  // Auto-scroll to bottom when new calculation is added
  useEffect(() => {
    if (history.length > prevHistoryLength.current && displayRef.current) {
      displayRef.current.scrollTop = displayRef.current.scrollHeight;
    }
    prevHistoryLength.current = history.length;
  }, [history.length]);

  return (
    <div className="main-display">
      <div className="display-screen" ref={displayRef}>
        {/* Show calculation history */}
        {history.map((item, index) => (
          <div key={index} className="history-entry">
            <div className="history-expression">{item.expression}</div>
            <div className="history-result">= {item.result}</div>
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