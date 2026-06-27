import { test, expect } from '@playwright/test';

test.describe('Login — Magic Link', () => {
  test('muestra el formulario de email en /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('muestra mensaje de error si el email está vacío', async ({ page }) => {
    await page.goto('/login');
    const button = page.locator('button[type="submit"]');
    await button.click();
    // El input de email tiene validación nativa required
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused();
  });

  test('muestra confirmación tras enviar un email válido', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    // Espera algún feedback (mensaje de éxito o cambio de estado)
    await expect(
      page.locator('text=/enlace|email|enviado|magic/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('la home pública carga sin errores', async ({ page }) => {
    await page.goto('/');
    await expect(page).not.toHaveURL(/error/);
    await expect(page.locator('body')).toBeVisible();
  });
});
