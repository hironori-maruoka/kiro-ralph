import { describe, it, expect } from 'vitest';
import { parseAddress, formatAddress, addressEquals } from '../../src/utils/address';

describe('Address Utilities', () => {
  describe('parseAddress', () => {
    it('should parse valid addresses', () => {
      expect(parseAddress('A1')).toEqual({ col: 0, row: 0 });
      expect(parseAddress('J20')).toEqual({ col: 9, row: 19 });
      expect(parseAddress('B5')).toEqual({ col: 1, row: 4 });
    });

    it('should return null for invalid column', () => {
      expect(parseAddress('K1')).toBeNull();
      expect(parseAddress('Z1')).toBeNull();
      expect(parseAddress('a1')).toBeNull();
    });

    it('should return null for invalid row', () => {
      expect(parseAddress('A0')).toBeNull();
      expect(parseAddress('A21')).toBeNull();
      expect(parseAddress('A99')).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(parseAddress('')).toBeNull();
      expect(parseAddress('1A')).toBeNull();
      expect(parseAddress('AA1')).toBeNull();
      expect(parseAddress('A')).toBeNull();
      expect(parseAddress('1')).toBeNull();
    });
  });

  describe('formatAddress', () => {
    it('should format valid addresses', () => {
      expect(formatAddress({ col: 0, row: 0 })).toBe('A1');
      expect(formatAddress({ col: 9, row: 19 })).toBe('J20');
      expect(formatAddress({ col: 1, row: 4 })).toBe('B5');
    });
  });

  describe('addressEquals', () => {
    it('should return true for equal addresses', () => {
      expect(addressEquals({ col: 0, row: 0 }, { col: 0, row: 0 })).toBe(true);
      expect(addressEquals({ col: 5, row: 10 }, { col: 5, row: 10 })).toBe(true);
    });

    it('should return false for different addresses', () => {
      expect(addressEquals({ col: 0, row: 0 }, { col: 0, row: 1 })).toBe(false);
      expect(addressEquals({ col: 0, row: 0 }, { col: 1, row: 0 })).toBe(false);
    });
  });
});
