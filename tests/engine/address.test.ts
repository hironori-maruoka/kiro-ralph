import { describe, it, expect } from 'vitest';
import { parseAddress, formatAddress } from '../../src/utils/address';

describe('Address Conversion Utilities', () => {
  describe('parseAddress', () => {
    it('should parse valid addresses', () => {
      expect(parseAddress('A1')).toEqual({ col: 0, row: 0 });
      expect(parseAddress('J20')).toEqual({ col: 9, row: 19 });
      expect(parseAddress('B5')).toEqual({ col: 1, row: 4 });
    });

    it('should return null for invalid addresses', () => {
      expect(parseAddress('K1')).toBeNull();
      expect(parseAddress('A21')).toBeNull();
      expect(parseAddress('A0')).toBeNull();
      expect(parseAddress('Z99')).toBeNull();
      expect(parseAddress('1A')).toBeNull();
      expect(parseAddress('')).toBeNull();
      expect(parseAddress('AA1')).toBeNull();
    });
  });

  describe('formatAddress', () => {
    it('should format addresses correctly', () => {
      expect(formatAddress({ col: 0, row: 0 })).toBe('A1');
      expect(formatAddress({ col: 9, row: 19 })).toBe('J20');
      expect(formatAddress({ col: 1, row: 4 })).toBe('B5');
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain consistency', () => {
      const addresses = ['A1', 'J20', 'B5', 'E10'];
      addresses.forEach(addr => {
        const parsed = parseAddress(addr);
        expect(parsed).not.toBeNull();
        expect(formatAddress(parsed!)).toBe(addr);
      });
    });
  });
});
