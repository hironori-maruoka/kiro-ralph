import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Cell from '../../src/components/Cell';

describe('Cell Component', () => {
  const mockHandlers = {
    onSelect: vi.fn(),
    onEdit: vi.fn(),
    onCommit: vi.fn(),
    onCancel: vi.fn(),
    onEditingContentChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display Mode', () => {
    it('should render cell value in display mode', () => {
      render(
        <Cell
          value="42"
          isSelected={false}
          isEditing={false}
          editingContent=""
          {...mockHandlers}
        />
      );
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should call onSelect when clicked', () => {
      render(
        <Cell
          value="42"
          isSelected={false}
          isEditing={false}
          editingContent=""
          {...mockHandlers}
        />
      );
      fireEvent.click(screen.getByText('42'));
      expect(mockHandlers.onSelect).toHaveBeenCalledTimes(1);
    });

    it('should call onEdit when double-clicked', () => {
      render(
        <Cell
          value="42"
          isSelected={false}
          isEditing={false}
          editingContent=""
          {...mockHandlers}
        />
      );
      fireEvent.doubleClick(screen.getByText('42'));
      expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
    });

    it('should highlight selected cell', () => {
      const { container } = render(
        <Cell
          value="42"
          isSelected={true}
          isEditing={false}
          editingContent=""
          {...mockHandlers}
        />
      );
      const cell = container.firstChild as HTMLElement;
      expect(cell.className).toContain('ring-2');
      expect(cell.className).toContain('ring-blue-500');
    });

    it('should display error values in red', () => {
      render(
        <Cell
          value="#ERR"
          isSelected={false}
          isEditing={false}
          editingContent=""
          {...mockHandlers}
        />
      );
      const errorText = screen.getByText('#ERR');
      expect(errorText.parentElement?.className).toContain('text-red-600');
    });

    it('should display cycle errors in red', () => {
      render(
        <Cell
          value="#CYC"
          isSelected={false}
          isEditing={false}
          editingContent=""
          {...mockHandlers}
        />
      );
      const errorText = screen.getByText('#CYC');
      expect(errorText.parentElement?.className).toContain('text-red-600');
    });
  });

  describe('Edit Mode', () => {
    it('should render input field in edit mode', () => {
      render(
        <Cell
          value="42"
          isSelected={true}
          isEditing={true}
          editingContent="42"
          {...mockHandlers}
        />
      );
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('42');
    });

    it('should call onCommit when Enter is pressed', () => {
      render(
        <Cell
          value="42"
          isSelected={true}
          isEditing={true}
          editingContent="42"
          {...mockHandlers}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(mockHandlers.onCommit).toHaveBeenCalledWith('42');
    });

    it('should call onCancel when Escape is pressed', () => {
      render(
        <Cell
          value="42"
          isSelected={true}
          isEditing={true}
          editingContent="42"
          {...mockHandlers}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(mockHandlers.onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCommit when input loses focus', () => {
      render(
        <Cell
          value="42"
          isSelected={true}
          isEditing={true}
          editingContent="42"
          {...mockHandlers}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(mockHandlers.onCommit).toHaveBeenCalledWith('42');
    });
  });
});
