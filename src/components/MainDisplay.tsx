import React from 'react';

interface MainDisplayProps {
  value: string;
}

export const MainDisplay: React.FC<MainDisplayProps> = ({ value }) => {
  return (
    <div className="main-display">
      <div className="display-screen">
        {value || ''}
      </div>
    </div>
  );
};