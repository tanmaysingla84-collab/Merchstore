import React from 'react';

const Loader = ({ fullScreen = false }) => {
  const spinnerContent = (
    <div className="flex flex-col items-center justify-center gap-3 p-6">
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-brand-maroon-100 animate-pulse"></div>
        {/* Spinning indicator */}
        <div className="absolute inset-0 rounded-full border-4 border-t-brand-maroon-700 border-r-brand-gold-500 animate-spin"></div>
      </div>
      <p className="font-display font-medium text-brand-dark-600 text-sm tracking-wider animate-pulse uppercase">
        Loading...
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-brand-dark-50/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default Loader;
