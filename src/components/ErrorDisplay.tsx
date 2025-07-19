import React, { useEffect, useState } from 'react';

interface ErrorDisplayProps {
  error?: string;
  onClear?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClear }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setVisible(true);
      
      // Haptic feedback for errors (if supported)
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]); // Short error pattern
      }

      // Auto-clear after 3 seconds
      const timeout = setTimeout(() => {
        setVisible(false);
        if (onClear) {
          setTimeout(onClear, 300); // Wait for fade animation
        }
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [error, onClear]);

  if (!error) return null;

  return (
    <div className={`error-display ${visible ? 'visible' : ''}`}>
      <div className="error-content">
        <span className="error-icon">⚠️</span>
        <span className="error-message">{error}</span>
      </div>
    </div>
  );
};