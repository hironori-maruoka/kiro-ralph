import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { FormulaBar } from '../../src/components/FormulaBar';

describe('FormulaBar - Requirements 11.1, 11.2, 11.3, 11.4', () => {
  it('should display selected cell address - Requirement 11.2', () => {
    render(
      <FormulaBar
        selectedCell={{ col: 0, row: 0 }}
        cellContent="=A1+B2"
        onContentChange={() => {}}
      />
    );
    
    expect(screen.getByText('A1')).toBeDefined();
  });

  it('should display cell raw content - Requirement 11.3', () => {
    render(
      <FormulaBar
        selectedCell={{ col: 1, row: 4 }}
        cellContent="=SUM(A1:A5)"
        onContentChange={() => {}}
      />
    );
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('=SUM(A1:A5)');
  });

  it('should display formula with = sign - Requirement 11.3', () => {
    render(
      <FormulaBar
        selectedCell={{ col: 2, row: 3 }}
        cellContent="=A1*2"
        onContentChange={() => {}}
      />
    );
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('=A1*2');
  });

  it('should call onContentChange when edited - Requirement 11.4', async () => {
    const user = userEvent.setup();
    const onContentChange = vi.fn();
    
    render(
      <FormulaBar
        selectedCell={{ col: 0, row: 0 }}
        cellContent="10"
        onContentChange={onContentChange}
      />
    );
    
    const input = screen.getByRole('textbox');
    await user.type(input, '5');
    
    expect(onContentChange).toHaveBeenCalledWith('105');
  });

  it('should show empty when no cell selected', () => {
    render(
      <FormulaBar
        selectedCell={null}
        cellContent=""
        onContentChange={() => {}}
      />
    );
    
    expect(screen.queryByText(/[A-J][0-9]+/)).toBeNull();
  });

  it('should update input value when cellContent changes', () => {
    const { rerender } = render(
      <FormulaBar
        selectedCell={{ col: 0, row: 0 }}
        cellContent="10"
        onContentChange={() => {}}
      />
    );
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('10');
    
    rerender(
      <FormulaBar
        selectedCell={{ col: 0, row: 0 }}
        cellContent="20"
        onContentChange={() => {}}
      />
    );
    
    expect(input.value).toBe('20');
  });
});
