import { test as setup } from "@playwright/test";
import path from "path";
import fs from "fs";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("acquire auth tokens", async ({ page, request }) => {
  const username = process.env.E2E_USERNAME ?? "admin";
  const password = process.env.E2E_PASSWORD ?? "admin";
  const apiBase = process.env.E2E_API_URL ?? "http://127.0.0.1:8000/api/v1";

  // Obtain JWT tokens directly from DRF — faster than UI login and more robust
  const tokenRes = await request.post(`${apiBase}/auth/token/`, {
    data: { username, password },
  });

  if (!tokenRes.ok()) {
    const body = await tokenRes.text();
    throw new Error(
      `Auth setup failed (${tokenRes.status()}): ${body}\n` +
        `Check E2E_USERNAME/E2E_PASSWORD and that backend is running on ${apiBase}`
    );
  }

  const { access, refresh } = (await tokenRes.json()) as {
    access: string;
    refresh: string;
  };

  // Seed cookies on the browser context for http://localhost:3000.
  // Mirrors what the Next.js /api/auth/login route handler sets:
  //   - access_token: httpOnly:false (auth store reads it via document.cookie)
  //   - refresh_token: httpOnly:true  (used only by the refresh route handler)
  await page.context().addCookies([
    {
      name: "access_token",
      value: access,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Strict",
    },
    {
      name: "refresh_token",
      value: refresh,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    },
  ]);

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
