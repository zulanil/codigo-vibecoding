import { test as base, type APIRequestContext } from "@playwright/test";

const API_BASE = process.env.E2E_API_URL ?? "http://127.0.0.1:8000/api/v1";

async function getAuthToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API_BASE}/auth/token/`, {
    data: {
      username: process.env.E2E_USERNAME ?? "admin",
      password: process.env.E2E_PASSWORD ?? "admin",
    },
  });
  if (!res.ok()) throw new Error(`Auth token request failed: ${res.status()}`);
  const { access } = (await res.json()) as { access: string };
  return access;
}

type Fixtures = {
  api: {
    seed: (endpoint: string, payload: Record<string, unknown>) => Promise<number>;
    remove: (endpoint: string, id: number) => Promise<void>;
    get: (endpoint: string) => Promise<unknown>;
    patch: (endpoint: string, id: number, payload: Record<string, unknown>) => Promise<void>;
  };
};

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => {
    const token = await getAuthToken(request);
    const headers = { Authorization: `Bearer ${token}` };

    await use({
      async seed(endpoint, payload) {
        const url = `${API_BASE}/${endpoint}/`.replace(/\/\/$/, "/");
        const res = await request.post(url, { headers, data: payload });
        if (!res.ok()) {
          const body = await res.text();
          throw new Error(`seed POST ${url} failed (${res.status()}): ${body}`);
        }
        const data = (await res.json()) as { id: number };
        return data.id;
      },
      async remove(endpoint, id) {
        const url = `${API_BASE}/${endpoint}/${id}/`;
        await request.delete(url, { headers });
      },
      async get(endpoint) {
        const url = `${API_BASE}/${endpoint}/`.replace(/\/\/$/, "/");
        const res = await request.get(url, { headers });
        if (!res.ok()) throw new Error(`GET ${url} failed: ${res.status()}`);
        return res.json();
      },
      async patch(endpoint, id, payload) {
        const url = `${API_BASE}/${endpoint}/${id}/`;
        const res = await request.patch(url, { headers, data: payload });
        if (!res.ok()) {
          const body = await res.text();
          throw new Error(`PATCH ${url} failed (${res.status()}): ${body}`);
        }
      },
    });
  },
});

export { expect } from "@playwright/test";
