'use client';

import { useState, useEffect } from 'react';

const TUTORIAL_STEPS = [
  {
    emoji: '🐰',
    title: '토끼를 이동시키세요',
    description: '빛나는 타일을 클릭하면 토끼가 이동합니다.',
  },
  {
    emoji: '🐚🦀🐠',
    title: '위험도를 확인하세요',
    description: '이모지가 위험할수록 주변에 심복이 많아요. 🐚안전 → 🐉위험!',
  },
  {
    emoji: '🌊',
    title: '출구를 찾아 탈출!',
    description: '보드 가장자리의 출구를 찾아 용궁에서 탈출하세요!',
  },
];

export function Tutorial() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('tutorial-seen');
    if (!seen) {
      setVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    if (dontShow) {
      localStorage.setItem('tutorial-seen', 'true');
    }
    setVisible(false);
  };

  if (!visible) return null;

  const currentStep = TUTORIAL_STEPS[step];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(5, 10, 20, 0.8)' }}
      onClick={handleNext}
    >
      <div
        className="max-w-sm mx-4 p-6 rounded-2xl text-center space-y-4 animate-fade-in-up"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          backdropFilter: 'blur(12px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl">{currentStep.emoji}</div>
        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {currentStep.title}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {currentStep.description}
        </p>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 pt-2">
          {TUTORIAL_STEPS.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                backgroundColor: i === step ? '#4fc3f7' : 'rgba(255,255,255,0.2)',
                transform: i === step ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            onClick={handleNext}
            className="px-6 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
            style={{
              background: 'var(--button-primary)',
              color: 'white',
            }}
          >
            {step < TUTORIAL_STEPS.length - 1 ? '다음' : '시작하기!'}
          </button>

          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="rounded"
            />
            다시 보지 않기
          </label>
        </div>
      </div>
    </div>
  );
}

// Collapsible danger legend panel
export function DangerLegend() {
  const [isOpen, setIsOpen] = useState(false);

  const legends = [
    { emoji: '🐚', label: '안전', level: '1' },
    { emoji: '🦀', label: '낮음', level: '2' },
    { emoji: '🐠', label: '보통', level: '3' },
    { emoji: '🐡', label: '주의', level: '4' },
    { emoji: '🪸', label: '위험', level: '5' },
    { emoji: '🦑', label: '높음', level: '6' },
    { emoji: '🦈', label: '극위험', level: '7' },
    { emoji: '🐉', label: '심연', level: '8' },
  ];

  return (
    <div className="relative z-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs transition-colors hover:text-white flex items-center gap-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {isOpen ? '▼' : '▶'} 위험도 범례
      </button>
      {isOpen && (
        <div
          className="mt-2 p-3 rounded-lg grid grid-cols-4 gap-2 text-xs animate-fade-in-up"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
          }}
        >
          {legends.map((l) => (
            <div key={l.level} className="flex items-center gap-1">
              <span>{l.emoji}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
