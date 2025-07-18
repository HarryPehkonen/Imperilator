import React from 'react';

interface GlobalControlsProps {
  onClear: () => void;
  onBackspace: () => void;
}

export const GlobalControls: React.FC<GlobalControlsProps> = ({
  onClear,
  onBackspace,
}) => {
  return (
    <div className="global-controls">
      <button onClick={onClear} className="clear-btn">Clear</button>
      <button onClick={onBackspace} className="backspace-btn">⌫</button>
    </div>
  );
};
