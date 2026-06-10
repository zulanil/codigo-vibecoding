import { test, expect } from "@playwright/test";

const username = process.env.E2E_USERNAME ?? "admin";
const password = process.env.E2E_PASSWORD ?? "admin";

test.describe("Auth flow — sin sesión", () => {
  // Estos tests parten sin cookies (no usan playwright/.auth/user.json).
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login con credenciales válidas redirige a /dashboard y muestra el layout", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel("Usuario").fill(username);
    await page.getByLabel("Contraseña").fill(password);
    await page.getByRole("button", { name: "Ingresar" }).click();

    await page.waitForURL("**/dashboard**", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);

    // Sidebar (desktop)
    await expect(
      page.getByRole("link", { name: "Dashboard" })
    ).toBeVisible();

    // Topbar (perfil dropdown)
    await expect(page.locator('[data-slot="dropdown-menu-trigger"]')).toBeVisible();
  });

  test("login con credenciales inválidas muestra error y no redirige", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel("Usuario").fill("wrong_user");
    await page.getByLabel("Contraseña").fill("wrong_pass");
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(
      page.getByText("Usuario o contraseña incorrectos")
    ).toBeVisible({ timeout: 5_000 });

    await expect(page).toHaveURL(/\/login/);
  });

  test("sin token, visitar /warehouses redirige a /login", async ({
    page,
  }) => {
    await page.goto("/warehouses");

    await page.waitForURL("**/login**", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel("Usuario")).toBeVisible();
  });
});

test.describe("Auth flow — sesión activa", () => {
  // Estos tests usan playwright/.auth/user.json (cookies generadas en auth.setup.ts).

  test("logout limpia tokens y vuelve a /login; reintentar /dashboard redirige a /login", async ({
    page,
  }) => {
    // Next.js dev compila rutas on-demand; bajo carga (varios workers) la
    // primera visita a /dashboard puede tardar bastante.
    test.slow();

    await page.goto("/dashboard");
    await expect(
      page.getByRole("link", { name: "Dashboard" })
    ).toBeVisible();

    // Esperar a que la hidratación termine: un click antes de tiempo se pierde
    // y el menú (base-ui) no llega a abrirse.
    const trigger = page.locator('[data-slot="dropdown-menu-trigger"]');
    await expect(trigger).toBeVisible();
    await page.waitForTimeout(1000);

    // Abrir el dropdown de perfil y hacer click en "Cerrar sesión"
    await trigger.click();
    await page.getByText("Cerrar sesión").click();

    await page.waitForURL("**/login**", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);

    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === "access_token")).toBeUndefined();
    expect(cookies.find((c) => c.name === "refresh_token")).toBeUndefined();

    // Reintentar acceder a una ruta protegida
    await page.goto("/dashboard");
    await page.waitForURL("**/login**", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("access token inválido se refresca automáticamente y no expulsa al usuario", async ({
    page,
  }) => {
    await page.goto("/warehouses");
    await expect(page.getByText(/registros$/)).toBeVisible({ timeout: 10_000 });

    // Corromper el access_token (firma inválida) manteniendo el refresh_token válido
    const cookies = await page.context().cookies();
    const access = cookies.find((c) => c.name === "access_token");
    expect(access).toBeDefined();

    const corrupted = access!.value.slice(0, -1) + (access!.value.endsWith("a") ? "b" : "a");
    await page.context().addCookies([{ ...access!, value: corrupted }]);

    // Recargar: el request a /warehouses/ devolverá 401, el interceptor refresca
    // el token vía /api/auth/refresh (refresh_token sigue válido) y reintenta.
    await page.reload();

    await expect(page.getByText(/registros$/)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/warehouses/);
  });
});
