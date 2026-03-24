import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn() - class name merging', () => {
  it('should merge conflicting Tailwind padding classes', () => {
    // Later value should win
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('should merge conflicting Tailwind width classes', () => {
    expect(cn('w-full', 'w-1/2')).toBe('w-1/2');
    expect(cn('w-1/2', 'w-full')).toBe('w-full');
  });

  it('should preserve non-conflicting classes', () => {
    const result = cn('text-red-500', 'font-bold');
    expect(result).toContain('text-red-500');
    expect(result).toContain('font-bold');
  });

  it('should handle conditional classes with objects', () => {
    const result = cn('base-class', { 'conditional-class': true, 'disabled-class': false });
    expect(result).toContain('base-class');
    expect(result).toContain('conditional-class');
    expect(result).not.toContain('disabled-class');
  });

  it('should return empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('should handle undefined and null inputs gracefully', () => {
    expect(cn('p-2', undefined, null, 'p-4')).toBe('p-4');
  });
});
