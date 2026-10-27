import { InjectionToken } from '@angular/core';

/** Same-origin path: `ng serve` proxies `/api` to the backend (proxy.conf.json), so no CORS is needed. */
export const API_URL = new InjectionToken<string>('API_URL', {
  factory: () => '/api',
});
