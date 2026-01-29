import { test, expect } from '@playwright/test';

test.describe('Excel Lite E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display grid with headers', async ({ page }) => {
    await expect(page.locator('text=Excel Lite')).toBeVisible();
    await expect(page.locator('text=A')).toBeVisible();
    await expect(page.locator('text=J')).toBeVisible();
    await expect(page.locator('text=1').first()).toBeVisible();
    await expect(page.locator('text=20').first()).toBeVisible();
  });

  test('should select cell on click', async ({ page }) => {
    const cell = page.locator('[data-testid="cell-0-0"]');
    await cell.click();
    await expect(cell).toHaveClass(/bg-blue-100/);
  });

  test('should enter edit mode on double click', async ({ page }) => {
    const cell = page.locator('[data-testid="cell-0-0"]');
    await cell.dblclick();
    const input = cell.locator('input');
    await expect(input).toBeVisible();
  });

  test('should enter data and display it', async ({ page }) => {
    const cell = page.locator('[data-testid="cell-0-0"]');
    await cell.dblclick();
    await cell.locator('input').fill('42');
    await cell.locator('input').press('Enter');
    await expect(cell).toContainText('42');
  });

  test('should evaluate simple formula', async ({ page }) => {
    const cell = page.locator('[data-testid="cell-0-0"]');
    await cell.dblclick();
    await cell.locator('input').fill('=5+3');
    await cell.locator('input').press('Enter');
    await expect(cell).toContainText('8');
  });

  test('should evaluate cell reference', async ({ page }) => {
    const cellA1 = page.locator('[data-testid="cell-0-0"]');
    await cellA1.dblclick();
    await cellA1.locator('input').fill('10');
    await cellA1.locator('input').press('Enter');

    const cellB1 = page.locator('[data-testid="cell-1-0"]');
    await cellB1.dblclick();
    await cellB1.locator('input').fill('=A1*2');
    await cellB1.locator('input').press('Enter');
    await expect(cellB1).toContainText('20');
  });

  test('should update dependent cells on change', async ({ page }) => {
    const cellA1 = page.locator('[data-testid="cell-0-0"]');
    await cellA1.dblclick();
    await cellA1.locator('input').fill('5');
    await cellA1.locator('input').press('Enter');

    const cellB1 = page.locator('[data-testid="cell-1-0"]');
    await cellB1.dblclick();
    await cellB1.locator('input').fill('=A1+10');
    await cellB1.locator('input').press('Enter');
    await expect(cellB1).toContainText('15');

    await cellA1.dblclick();
    await cellA1.locator('input').fill('20');
    await cellA1.locator('input').press('Enter');
    await expect(cellB1).toContainText('30');
  });

  test('should display error for invalid formula', async ({ page }) => {
    const cell = page.locator('[data-testid="cell-0-0"]');
    await cell.dblclick();
    await cell.locator('input').fill('=1++2');
    await cell.locator('input').press('Enter');
    await expect(cell).toContainText('#ERR');
  });

  test('should detect circular reference', async ({ page }) => {
    const cellA1 = page.locator('[data-testid="cell-0-0"]');
    await cellA1.dblclick();
    await cellA1.locator('input').fill('=B1');
    await cellA1.locator('input').press('Enter');

    const cellB1 = page.locator('[data-testid="cell-1-0"]');
    await cellB1.dblclick();
    await cellB1.locator('input').fill('=A1');
    await cellB1.locator('input').press('Enter');

    await expect(cellA1).toContainText('#CYC');
    await expect(cellB1).toContainText('#CYC');
  });

  test('should evaluate SUM function', async ({ page }) => {
    const cellA1 = page.locator('[data-testid="cell-0-0"]');
    await cellA1.dblclick();
    await cellA1.locator('input').fill('10');
    await cellA1.locator('input').press('Enter');

    const cellA2 = page.locator('[data-testid="cell-0-1"]');
    await cellA2.dblclick();
    await cellA2.locator('input').fill('20');
    await cellA2.locator('input').press('Enter');

    const cellA3 = page.locator('[data-testid="cell-0-2"]');
    await cellA3.dblclick();
    await cellA3.locator('input').fill('30');
    await cellA3.locator('input').press('Enter');

    const cellB1 = page.locator('[data-testid="cell-1-0"]');
    await cellB1.dblclick();
    await cellB1.locator('input').fill('=SUM(A1:A3)');
    await cellB1.locator('input').press('Enter');
    await expect(cellB1).toContainText('60');
  });

  test('should show formula in formula bar', async ({ page }) => {
    const cellA1 = page.locator('[data-testid="cell-0-0"]');
    await cellA1.dblclick();
    await cellA1.locator('input').fill('=5+3');
    await cellA1.locator('input').press('Enter');

    await cellA1.click();
    const formulaBar = page.locator('[data-testid="formula-bar-input"]');
    await expect(formulaBar).toHaveValue('=5+3');
  });

  test('should navigate with arrow keys', async ({ page }) => {
    const cellA1 = page.locator('[data-testid="cell-0-0"]');
    await cellA1.click();
    await expect(cellA1).toHaveClass(/bg-blue-100/);

    await page.keyboard.press('ArrowRight');
    const cellB1 = page.locator('[data-testid="cell-1-0"]');
    await expect(cellB1).toHaveClass(/bg-blue-100/);

    await page.keyboard.press('ArrowDown');
    const cellB2 = page.locator('[data-testid="cell-1-1"]');
    await expect(cellB2).toHaveClass(/bg-blue-100/);
  });
});
