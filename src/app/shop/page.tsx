'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { loadSave, purchaseUpgrade } from '@/lib/storage/SaveData';
import { UPGRADE_CONFIGS } from '@/lib/runner/constants';
import { SaveData } from '@/lib/runner/types';

export default function ShopPage() {
  const router = useRouter();
  const [save, setSave] = useState<SaveData | null>(null);

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const handlePurchase = useCallback((id: string, cost: number) => {
    const ok = purchaseUpgrade(id as import('@/lib/runner/types').UpgradeId, cost);
    if (ok) {
      setSave(loadSave());
    }
  }, []);

  if (!save) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #5B9BD5 0%, #2a6a8a 30%, #1a3a5a 60%, #0a1628 100%)',
        }}
      >
        <div style={{ color: 'var(--text-primary)' }}>로딩 중...</div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #5B9BD5 0%, #2a6a8a 30%, #1a3a5a 60%, #0a1628 100%)',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Back button */}
        <div style={{ marginBottom: '1rem' }}>
          <Button onClick={() => router.push('/')} variant="secondary" size="sm">
            ← 돌아가기
          </Button>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            🏪 당근 상점
          </h1>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#ffd700',
              padding: '0.5rem 1.5rem',
              background: 'rgba(10, 22, 40, 0.7)',
              borderRadius: '12px',
              display: 'inline-block',
              border: '1px solid rgba(255, 215, 0, 0.3)',
            }}
          >
            💰 {save.totalScore}
          </div>
        </div>

        {/* Upgrade grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '0.75rem',
            marginBottom: '2rem',
          }}
        >
          {UPGRADE_CONFIGS.map((cfg) => {
            const currentLevel = save.upgrades[cfg.id] ?? 0;
            const isMaxed = currentLevel >= cfg.maxLevel;
            const cost = isMaxed ? 0 : cfg.costs[currentLevel];
            const canAfford = !isMaxed && save.totalScore >= cost;

            return (
              <div
                key={cfg.id}
                style={{
                  background: 'rgba(10, 22, 40, 0.85)',
                  border: `1px solid ${isMaxed ? 'rgba(255, 215, 0, 0.4)' : 'rgba(100, 180, 255, 0.2)'}`,
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div style={{ fontSize: '2rem' }}>{cfg.emoji}</div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                  }}
                >
                  {cfg.name}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: isMaxed ? '#ffd700' : 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  Lv.{currentLevel}/{cfg.maxLevel}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                  }}
                >
                  {currentLevel > 0 ? cfg.effect(currentLevel) : cfg.description}
                </div>
                <div style={{ marginTop: '0.25rem', width: '100%' }}>
                  {isMaxed ? (
                    <div
                      style={{
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        color: '#ffd700',
                        fontWeight: 700,
                        padding: '0.4rem',
                        background: 'rgba(255, 215, 0, 0.1)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                      }}
                    >
                      MAX
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchase(cfg.id, cost)}
                      disabled={!canAfford}
                      style={{
                        width: '100%',
                        padding: '0.4rem',
                        borderRadius: '6px',
                        border: canAfford
                          ? '1px solid rgba(255, 215, 0, 0.5)'
                          : '1px solid rgba(100, 100, 100, 0.3)',
                        background: canAfford
                          ? 'rgba(255, 215, 0, 0.15)'
                          : 'rgba(50, 50, 50, 0.3)',
                        color: canAfford ? '#ffd700' : 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                      }}
                    >
                      💰 {cost}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Start game button */}
        <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
          <Button
            onClick={() => router.push('/runner')}
            variant="primary"
            size="lg"
            className="text-xl px-12 py-4"
          >
            🏃 게임 시작
          </Button>
        </div>
      </div>
    </main>
  );
}
