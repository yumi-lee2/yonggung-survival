import { Lane } from './types';
import { LANE_COUNT } from './constants';

export type InputAction = 'left' | 'right' | 'dash' | 'useItem';

type InputCallback = (action: InputAction) => void;

export class InputManager {
  private callback: InputCallback | null = null;
  private element: HTMLElement | null = null;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;

  constructor() {
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
  }

  attach(element: HTMLElement, callback: InputCallback) {
    this.callback = callback;
    this.element = element;
    window.addEventListener('keydown', this.boundKeyDown);
    element.addEventListener('touchstart', this.boundTouchStart, { passive: true });
    element.addEventListener('touchend', this.boundTouchEnd, { passive: true });
  }

  detach() {
    window.removeEventListener('keydown', this.boundKeyDown);
    if (this.element) {
      this.element.removeEventListener('touchstart', this.boundTouchStart);
      this.element.removeEventListener('touchend', this.boundTouchEnd);
    }
    this.callback = null;
    this.element = null;
  }

  private emit(action: InputAction) {
    this.callback?.(action);
  }

  private handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        this.emit('left');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        this.emit('right');
        break;
      case 'ArrowUp':
      case ' ':
        e.preventDefault();
        this.emit('dash');
        break;
      case 'f':
      case 'F':
      case 'Enter':
        e.preventDefault();
        this.emit('useItem');
        break;
    }
  }

  private handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
  }

  private handleTouchEnd(e: TouchEvent) {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    const dt = Date.now() - this.touchStartTime;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Swipe detection
    if (absDx > 30 || absDy > 30) {
      if (absDy > absDx && dy < -30) {
        // Swipe up = dash
        this.emit('dash');
      } else if (absDx > absDy) {
        this.emit(dx < 0 ? 'left' : 'right');
      }
      return;
    }

    // Tap detection
    if (dt < 300 && absDx < 20 && absDy < 20) {
      if (!this.element) return;
      const rect = this.element.getBoundingClientRect();
      const relX = touch.clientX - rect.left;
      const mid = rect.width / 2;
      // Tap top area = use item
      const relY = touch.clientY - rect.top;
      if (relY < rect.height * 0.3) {
        this.emit('useItem');
      } else {
        this.emit(relX < mid ? 'left' : 'right');
      }
    }
  }
}

