/**
 * Точка выбора источника данных. Чтобы подключить настоящий бэкенд,
 * достаточно вернуть здесь HTTP-реализацию HermesApi — страницы не меняются.
 */
import type { HermesApi, PaymentGatewaySimulator } from "./api";
import { createDemoControls, type DemoControls } from "./demo/demoControls";
import { createMockApi } from "./mock/mockApi";
import { MockStore, STORAGE_KEY } from "./mock/store";

interface DataLayer {
  api: HermesApi;
  gateway: PaymentGatewaySimulator;
  demo: DemoControls;
}

let layer: DataLayer | null = null;

export function getDataLayer(): DataLayer {
  if (layer) return layer;
  const storage = typeof window !== "undefined" ? window.localStorage : null;
  const store = new MockStore(storage);
  const { api, gateway } = createMockApi(store, { latencyMs: 260 });
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) store.reload();
    });
  }
  layer = { api, gateway, demo: createDemoControls(store) };
  return layer;
}

export type { HermesApi } from "./api";
