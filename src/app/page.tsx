'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Difficulty } from '@/lib/game/types';
import { useHighScores } from '@/hooks/useHighScores';
import DifficultySelect from '@/components/game/DifficultySelect';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function MenuPage() {
  const router = useRouter();
  const { getTopScore } = useHighScores();
  const [showStory, setShowStory] = useState(false);

  const highScores = {
    easy: getTopScore('easy'),
    normal: getTopScore('normal'),
    hard: getTopScore('hard'),
  };

  const handleSelect = useCallback(
    (difficulty: Difficulty) => {
      router.push(`/game?difficulty=${difficulty}`);
    },
    [router]
  );

  return (
    <main className="bg-underwater min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bubble absolute rounded-full"
            style={{
              width: `${8 + i * 4}px`,
              height: `${8 + i * 4}px`,
              left: `${15 + i * 15}%`,
              bottom: '-20px',
              background: 'radial-gradient(circle at 30% 30%, rgba(100, 200, 255, 0.3), rgba(100, 200, 255, 0.05))',
              '--bubble-duration': `${6 + i * 2}s`,
              '--bubble-delay': `${i * 1.5}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Title */}
      <div className="text-center mb-10 relative z-10">
        <div className="text-6xl mb-4">🐰</div>
        <h1
          className="text-4xl sm:text-5xl font-extrabold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          용궁에서 살아남기
        </h1>
        <p className="text-base sm:text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
          별주부전 3D 지뢰찾기
        </p>
        <button
          onClick={() => setShowStory(true)}
          className="text-sm underline underline-offset-4 transition-colors hover:text-white"
          style={{ color: 'var(--text-muted)' }}
        >
          이야기 보기
        </button>
      </div>

      {/* Difficulty Selection */}
      <div className="relative z-10 w-full">
        <DifficultySelect onSelect={handleSelect} highScores={highScores} />
      </div>

      {/* How to play */}
      <div className="relative z-10 mt-10 max-w-md text-center">
        <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
          조작법
        </h2>
        <div className="flex justify-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>좌클릭: 타일 공개</span>
          <span>우클릭: 깃발 표시</span>
          <span>모바일: 길게 누르기 = 깃발</span>
        </div>
      </div>

      {/* Story Modal */}
      <Modal isOpen={showStory} onClose={() => setShowStory(false)}>
        <div className="space-y-4">
          <div className="text-4xl text-center">🐢🐰</div>
          <h2 className="text-xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>
            별주부전
          </h2>
          <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <p>
              옛날 옛적, 용왕이 병이 들어 토끼의 간이 필요하다 하였습니다.
              충신 자라(별주부)가 육지로 올라가 토끼를 꼬드겨 용궁으로 데려왔습니다.
            </p>
            <p>
              용궁에 도착한 토끼는 뒤늦게 자신의 처지를 깨닫고 탈출을 결심합니다.
              하지만 용궁 곳곳에는 용왕의 심복들이 숨어 있습니다...
            </p>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
              심복들을 피해 안전한 길을 찾아 용궁에서 탈출하세요!
            </p>
          </div>
          <div className="text-center pt-2">
            <Button onClick={() => setShowStory(false)} variant="secondary">
              닫기
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
