'use client';

import React from 'react';
import Image from 'next/image';

const DynamicBackground = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <div className="relative w-full h-full bg-black">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url(/lion-digital-guardian/background-pattern/cyber-grid_v1_tile.webp)] bg-repeat bg-size-[200px_200px]" />
        
        {/* Optional: Add a subtle overlay or gradient if needed */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-50" />
      </div>
    </div>
  );
};

export default DynamicBackground;
