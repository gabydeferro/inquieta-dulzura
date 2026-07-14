import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fadeUp, fadeIn, fadeInFromLeft, staggerContainer, useReducedMotion } from '../lib/animations';
import { renderHook } from '@testing-library/react';

// ── Variant object shape tests ─────────────────────────────────────

describe('fadeUp variant', () => {
  it('has hidden state with opacity 0 and y 8', () => {
    expect(fadeUp.hidden).toEqual(
      expect.objectContaining({ opacity: 0, y: 8 })
    );
  });

  it('has visible state that animates to opacity 1 and y 0', () => {
    const visible = fadeUp.visible as Record<string, unknown>;
    expect(visible.opacity).toBe(1);
    expect(visible.y).toBe(0);
  });
});

describe('fadeIn variant', () => {
  it('has hidden state with opacity 0', () => {
    expect(fadeIn.hidden).toEqual(
      expect.objectContaining({ opacity: 0 })
    );
  });

  it('has visible state with opacity 1', () => {
    const visible = fadeIn.visible as Record<string, unknown>;
    expect(visible.opacity).toBe(1);
  });

  it('does not include any transform in hidden', () => {
    const hidden = fadeIn.hidden as Record<string, unknown>;
    expect(hidden.y).toBeUndefined();
    expect(hidden.x).toBeUndefined();
  });
});

describe('fadeInFromLeft variant', () => {
  it('has hidden state with opacity 0 and x -12', () => {
    expect(fadeInFromLeft.hidden).toEqual(
      expect.objectContaining({ opacity: 0, x: -12 })
    );
  });

  it('has visible state that animates to opacity 1 and x 0', () => {
    const visible = fadeInFromLeft.visible as Record<string, unknown>;
    expect(visible.opacity).toBe(1);
    expect(visible.x).toBe(0);
  });
});

describe('staggerContainer variant', () => {
  it('has hidden state with opacity 0', () => {
    expect(staggerContainer.hidden).toEqual(
      expect.objectContaining({ opacity: 0 })
    );
  });

  it('has visible state with staggerChildren in transition', () => {
    const visible = staggerContainer.visible as Record<string, unknown>;
    const transition = visible.transition as Record<string, unknown>;
    expect(transition.staggerChildren).toBe(0.08);
  });
});

// ── useReducedMotion hook tests ────────────────────────────────────

describe('useReducedMotion', () => {
  let matchMediaSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock window.matchMedia
    matchMediaSpy = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal('matchMedia', matchMediaSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns standard variants when reduced motion is not preferred', () => {
    matchMediaSpy.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());

    // fadeUp should have y transform
    const fadeUpVisible = result.current.fadeUp.visible as Record<string, unknown>;
    expect(fadeUpVisible.y).toBe(0);
  });

  it('returns opacity-only variants when reduced motion is preferred', () => {
    matchMediaSpy.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());

    // fadeUp should NOT have y transform
    const fadeUpVisible = result.current.fadeUp.visible as Record<string, unknown>;
    expect(fadeUpVisible.y).toBeUndefined();
    expect(fadeUpVisible.opacity).toBe(1);

    // fadeInFromLeft should NOT have x transform
    const leftVisible = result.current.fadeInFromLeft.visible as Record<string, unknown>;
    expect(leftVisible.x).toBeUndefined();
    expect(leftVisible.opacity).toBe(1);
  });

  it('returns zero-duration variants when reduced motion is active', () => {
    matchMediaSpy.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());

    const fadeUpVisible = result.current.fadeUp.visible as Record<string, unknown>;
    const transition = fadeUpVisible.transition as Record<string, unknown>;
    expect(transition.duration).toBe(0);
  });

  it('returns zero staggerChildren when reduced motion is active', () => {
    matchMediaSpy.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());

    const staggerVisible = result.current.staggerContainer.visible as Record<string, unknown>;
    const transition = staggerVisible.transition as Record<string, unknown>;
    expect(transition.staggerChildren).toBe(0);
  });
});
