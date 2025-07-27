import React from 'react';
import './SpinnerOverlay.css';

function SpinnerOverlay({ show }) {
  if (!show) return null;
  return (
    <div className="spinner-overlay">
      <div className="spinner" />
    </div>
  );
}

export default SpinnerOverlay; 