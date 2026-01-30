import { useState, useCallback, useMemo } from 'react';
import { SpreadsheetEngine } from '../engine/engine';
import { CellAddress } from '../engine/types';

interface UseSpreadsheetReturn {
  engine: SpreadsheetEngine;
  selectedCell: CellAddress | null;
  editingCell: CellAddress | null;
  editingContent: string;
  selectCell: (address: CellAddress) => void;
  startEditing: (address: CellAddress) => void;
  commitEdit: (content?: string) => void;
  cancelEdit: () => void;
  setEditingContent: (content: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  getCellDisplayValue: (address: CellAddress) => string;
  getCellRawContent: (address: CellAddress) => string;
}

export function useSpreadsheet(rows: number, cols: number): UseSpreadsheetReturn {
  const engine = useMemo(() => new SpreadsheetEngine(), []);
  const [selectedCell, setSelectedCell] = useState<CellAddress | null>({ col: 0, row: 0 });
  const [editingCell, setEditingCell] = useState<CellAddress | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [, forceUpdate] = useState({});

  const selectCell = useCallback((address: CellAddress) => {
    setSelectedCell(address);
  }, []);

  const startEditing = useCallback((address: CellAddress) => {
    const content = engine.getCellRawContent(address);
    setEditingCell(address);
    setEditingContent(content);
  }, [engine]);

  const commitEdit = useCallback((content?: string) => {
    if (editingCell) {
      const finalContent = content !== undefined ? content : editingContent;
      engine.setCellContent(editingCell, finalContent);
      setEditingCell(null);
      setEditingContent('');
      forceUpdate({});
    }
  }, [editingCell, editingContent, engine]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditingContent('');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    } else if (selectedCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        startEditing(selectedCell);
      } else if (e.key === 'ArrowUp' && selectedCell.row > 0) {
        e.preventDefault();
        selectCell({ ...selectedCell, row: selectedCell.row - 1 });
      } else if (e.key === 'ArrowDown' && selectedCell.row < rows - 1) {
        e.preventDefault();
        selectCell({ ...selectedCell, row: selectedCell.row + 1 });
      } else if (e.key === 'ArrowLeft' && selectedCell.col > 0) {
        e.preventDefault();
        selectCell({ ...selectedCell, col: selectedCell.col - 1 });
      } else if (e.key === 'ArrowRight' && selectedCell.col < cols - 1) {
        e.preventDefault();
        selectCell({ ...selectedCell, col: selectedCell.col + 1 });
      }
    }
  }, [editingCell, selectedCell, rows, cols, commitEdit, cancelEdit, startEditing, selectCell]);

  const getCellDisplayValue = useCallback((address: CellAddress) => {
    return engine.getCellDisplayValue(address);
  }, [engine]);

  const getCellRawContent = useCallback((address: CellAddress) => {
    return engine.getCellRawContent(address);
  }, [engine]);

  return {
    engine,
    selectedCell,
    editingCell,
    editingContent,
    selectCell,
    startEditing,
    commitEdit,
    cancelEdit,
    setEditingContent,
    handleKeyDown,
    getCellDisplayValue,
    getCellRawContent,
  };
}
