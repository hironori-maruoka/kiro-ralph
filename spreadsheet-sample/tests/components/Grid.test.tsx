import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Grid from '../../src/components/Grid';

describe('Grid Component', () => {
  describe('Grid Structure', () => {
    it('should render column headers A-J', () => {
      render(<Grid rows={20} cols={10} />);
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
      expect(screen.getByText('E')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
      expect(screen.getByText('G')).toBeInTheDocument();
      expect(screen.getByText('H')).toBeInTheDocument();
      expect(screen.getByText('I')).toBeInTheDocument();
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should render row headers 1-20', () => {
      render(<Grid rows={20} cols={10} />);
      for (let i = 1; i <= 20; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });

    it('should render grid with correct dimensions', () => {
      const { container } = render(<Grid rows={20} cols={10} />);
      const grid = container.querySelector('.inline-block');
      expect(grid).toBeInTheDocument();
    });
  });
});
