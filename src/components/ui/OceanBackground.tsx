'use client';

interface OceanBackgroundProps {
  variant?: 'menu' | 'game';
}

export default function OceanBackground({ variant = 'menu' }: OceanBackgroundProps) {
  const bubbleCount = variant === 'menu' ? 8 : 5;
  const particleCount = variant === 'menu' ? 6 : 3;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Rising bubbles from bottom */}
      {Array.from({ length: bubbleCount }, (_, i) => (
        <div
          key={`bubble-${i}`}
          className="bubble absolute rounded-full"
          style={{
            width: `${6 + (i % 4) * 4}px`,
            height: `${6 + (i % 4) * 4}px`,
            left: `${8 + i * (85 / bubbleCount)}%`,
            bottom: '-20px',
            background: 'radial-gradient(circle at 30% 30%, rgba(100, 200, 255, 0.25), rgba(100, 200, 255, 0.05))',
            '--bubble-duration': `${6 + (i % 3) * 3}s`,
            '--bubble-delay': `${i * 1.2}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Light particles in upper area */}
      {Array.from({ length: particleCount }, (_, i) => (
        <div
          key={`particle-${i}`}
          className="light-particle absolute rounded-full"
          style={{
            width: `${3 + (i % 3) * 2}px`,
            height: `${3 + (i % 3) * 2}px`,
            left: `${10 + i * (80 / particleCount)}%`,
            top: `${5 + (i % 4) * 8}%`,
            background: 'radial-gradient(circle, rgba(255, 255, 200, 0.6), rgba(255, 255, 200, 0.1))',
            '--particle-duration': `${2 + (i % 3) * 1.5}s`,
            '--particle-delay': `${i * 0.8}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Decorative seaweed silhouettes */}
      {variant === 'menu' && (
        <>
          <div
            className="absolute bottom-0 left-4 w-6 opacity-20"
            style={{
              height: '120px',
              background: 'linear-gradient(to top, #2a7a5a, transparent)',
              borderRadius: '50% 50% 0 0',
              animation: 'seaweedSway 4s ease-in-out infinite',
              transformOrigin: 'bottom center',
            }}
          />
          <div
            className="absolute bottom-0 left-12 w-4 opacity-15"
            style={{
              height: '80px',
              background: 'linear-gradient(to top, #2a7a5a, transparent)',
              borderRadius: '50% 50% 0 0',
              animation: 'seaweedSway 3.5s ease-in-out infinite 0.5s',
              transformOrigin: 'bottom center',
            }}
          />
          <div
            className="absolute bottom-0 right-4 w-5 opacity-20"
            style={{
              height: '100px',
              background: 'linear-gradient(to top, #2a7a5a, transparent)',
              borderRadius: '50% 50% 0 0',
              animation: 'seaweedSway 4.5s ease-in-out infinite 1s',
              transformOrigin: 'bottom center',
            }}
          />
          <div
            className="absolute bottom-0 right-14 w-4 opacity-15"
            style={{
              height: '70px',
              background: 'linear-gradient(to top, #2a7a5a, transparent)',
              borderRadius: '50% 50% 0 0',
              animation: 'seaweedSway 3s ease-in-out infinite 0.3s',
              transformOrigin: 'bottom center',
            }}
          />
        </>
      )}
    </div>
  );
}
