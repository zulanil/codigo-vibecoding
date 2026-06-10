/**
 * Prerequisitos para correr los tests E2E:
 *
 * 1. Backend Django corriendo en http://127.0.0.1:8000
 *      cd logistica-api
 *      .venv\Scripts\activate && python manage.py runserver 127.0.0.1:8000
 *      (usar 127.0.0.1 explícito: en Windows, Node.js resuelve "localhost" a ::1 IPv6
 *       pero Django runserver escucha solo IPv4 por defecto)
 *
 * 2. Frontend Next.js corriendo en http://localhost:3000
 *      cd logistica-fronted/logistica-fronted
 *      npm run dev
 *
 * 3. Usuario de test con credenciales en E2E_USERNAME / E2E_PASSWORD
 *      Crear superusuario: python manage.py createsuperuser
 *      O usuario normal: python manage.py shell -c "
 *        from django.contrib.auth import get_user_model; U=get_user_model();
 *        U.objects.create_user('testuser', password='testpass123')"
 *
 * NOTA: webServer no está configurado — los servidores se levantan manualmente
 * según las reglas del proyecto (CLAUDE.md: "Claude no debe correr npm run dev
 * ni ningún servidor de desarrollo de forma autónoma").
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  reporter: [["html"], ["list"]],
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: /login\.spec\.ts/,
    },
    {
      name: "login-tests",
      testMatch: /login\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
