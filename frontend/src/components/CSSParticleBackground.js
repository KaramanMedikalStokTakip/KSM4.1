import React, { useMemo } from 'react';

function CSSParticleBackground({ isDark = false }) {
  // Generate random particles
  const particles = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * -20
    }));
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(20px, -20px) rotate(90deg);
          }
          50% {
            transform: translate(-20px, -40px) rotate(180deg);
          }
          75% {
            transform: translate(-40px, -20px) rotate(270deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        .particle {
          position: absolute;
          border-radius: 50%;
          animation: float var(--duration) linear infinite, pulse 3s ease-in-out infinite;
          animation-delay: var(--delay);
        }
      `}</style>
      
      {particles.map(particle => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: isDark ? '#60a5fa' : '#3b82f6',
            '--duration': `${particle.duration}s`,
            '--delay': `${particle.delay}s`
          }}
        />
      ))}
    </div>
  );
}

export default CSSParticleBackground;
