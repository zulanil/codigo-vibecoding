import { test, expect } from "@playwright/test";

const username = process.env.E2E_USERNAME ?? "admin";
const password = process.env.E2E_PASSWORD ?? "admin";

test.describe("Login page", () => {
  test("valid credentials redirect to /dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Usuario").fill(username);
    await page.getByLabel("Contraseña").fill(password);
    await page.getByRole("button", { name: "Ingresar" }).click();

    await page.waitForURL("**/dashboard**", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("invalid credentials show error message", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Usuario").fill("wrong_user");
    await page.getByLabel("Contraseña").fill("wrong_pass");
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(
      page.getByText("Usuario o contraseña incorrectos")
    ).toBeVisible({ timeout: 5_000 });
  });
});
