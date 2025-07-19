import React from 'react';
import type { AppState } from '../types';

interface StateIndicatorsProps {
  currentState: AppState;
}

export const StateIndicators: React.FC<StateIndicatorsProps> = ({ currentState }) => {
  const states: AppState[] = ['Input', 'Imperial', 'Scalar'];
  
  return (
    <div className="state-indicators">
      <h4>Debug State LEDs</h4>
      <div className="led-container">
        {states.map(state => (
          <div key={state} className="led-wrapper">
            <div 
              className={`led ${currentState === state ? 'active' : ''} ${state.toLowerCase()}`}
            />
            <span className="led-label">{state}</span>
          </div>
        ))}
        {currentState === 'Error' && (
          <div className="led-wrapper">
            <div className="led active error" />
            <span className="led-label">Error</span>
          </div>
        )}
      </div>
    </div>
  );
};