'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function MenuPage() {
  const router = useRouter();
  const [showStory, setShowStory] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const highScore = (() => {
    try {
      return parseInt(localStorage.getItem('runner-highscore') || '0', 10);
    } catch {
      return 0;
    }
  })();

  return (
    <main className="bg-underwater min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative bubbles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="bubble absolute rounded-full"
            style={{
              left: `${10 + i * 12}%`,
              bottom: '-20px',
              width: `${6 + (i % 3) * 4}px`,
              height: `${6 + (i % 3) * 4}px`,
              background: 'rgba(200, 230, 255, 0.3)',
              ['--bubble-duration' as string]: `${6 + i * 1.5}s`,
              ['--bubble-delay' as string]: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <div className="text-center mb-10 relative z-10">
        <div className="text-6xl mb-4" style={{ animation: 'emojiBounce 2s ease-in-out infinite' }}>🐰</div>
        <h1
          className="text-4xl sm:text-5xl font-extrabold mb-3"
          style={{
            color: 'var(--text-primary)',
            textShadow: '0 0 20px rgba(255, 200, 100, 0.3), 0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          용궁에서 살아남기
        </h1>
        <p
          className="text-base sm:text-lg mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          별주부전 러너
        </p>

        {highScore > 0 && (
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            🏆 최고기록: {highScore}m
          </p>
        )}

        <button
          onClick={() => setShowStory(true)}
          className="text-sm underline underline-offset-4 transition-colors hover:text-white mt-2 block mx-auto"
          style={{ color: 'var(--text-muted)' }}
        >
          이야기 보기
        </button>
      </div>

      {/* Play Button */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <Button
          onClick={() => router.push('/runner')}
          variant="primary"
          size="lg"
          className="text-xl px-12 py-4"
        >
          🏃 게임 시작
        </Button>
        <Button
          onClick={() => setShowControls(true)}
          variant="secondary"
          size="sm"
        >
          조작법 보기
        </Button>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-10 text-center">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          용왕의 심복들을 피해 수면까지 도망치세요!
        </p>
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
              하지만 용궁 곳곳에는 용왕의 심복들이 가로막고 있습니다...
            </p>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
              심복들을 피해 수면까지 도망치세요!
            </p>
          </div>
          <div className="text-center pt-2">
            <Button onClick={() => setShowStory(false)} variant="secondary">
              닫기
            </Button>
          </div>
        </div>
      </Modal>

      {/* Controls Modal */}
      <Modal isOpen={showControls} onClose={() => setShowControls(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>
            조작법
          </h2>
          <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(20,40,70,0.5)' }}>
                <div className="font-bold mb-1">⌨️ 키보드</div>
                <div>← → : 좌우 이동</div>
                <div>↑ / Space : 대시</div>
                <div>F / Enter : 아이템 사용</div>
              </div>
              <div className="p-2 rounded-lg" style={{ background: 'rgba(20,40,70,0.5)' }}>
                <div className="font-bold mb-1">📱 모바일</div>
                <div>좌우 스와이프 : 이동</div>
                <div>위로 스와이프 : 대시</div>
                <div>화면 상단 탭 : 아이템</div>
              </div>
            </div>
            <div className="p-2 rounded-lg" style={{ background: 'rgba(20,40,70,0.5)' }}>
              <div className="font-bold mb-1">🎯 목표</div>
              <div>장애물을 피하고 진주를 모으며 최대한 멀리 가세요!</div>
              <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                💡 대시(Space)는 0.3초 무적 + 2초 쿨다운
              </div>
            </div>
          </div>
          <div className="text-center pt-2">
            <Button onClick={() => setShowControls(false)} variant="secondary">
              닫기
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
