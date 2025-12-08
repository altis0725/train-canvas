
import React from 'react';

const StarryBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#020617]">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f172a]/50 to-[#020617]" />
            <div className="stars-sm" />
            <div className="stars-md" />
            <div className="stars-lg" />

            <style>{`
        .stars-sm {
          width: 1px;
          height: 1px;
          background: transparent;
          box-shadow: ${generateStars(700)};
          animation: animStar 50s linear infinite;
        }
        .stars-md {
          width: 2px;
          height: 2px;
          background: transparent;
          box-shadow: ${generateStars(200)};
          animation: animStar 100s linear infinite;
        }
        .stars-lg {
          width: 3px;
          height: 3px;
          background: transparent;
          box-shadow: ${generateStars(100)};
          animation: animStar 150s linear infinite;
        }
        
        @keyframes animStar {
          from { transform: translateY(0px); }
          to { transform: translateY(-2000px); }
        }
      `}</style>
        </div>
    );
};

// Helper function to generate random stars for box-shadow
function generateStars(count: number) {
    let value = '';
    for (let i = 0; i < count; i++) {
        const x = Math.floor(Math.random() * 2000);
        const y = Math.floor(Math.random() * 2000);
        value += `${x}px ${y}px #FFF${i < count - 1 ? ', ' : ''}`;
    }
    return value;
}

export default StarryBackground;
