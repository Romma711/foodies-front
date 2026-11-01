/**
 * Production build settings. The bundle calls the API on the same origin, so the server that
 * serves the app must proxy `/api` to the Spring Boot backend (as `proxy.conf.json` does locally).
 * Change `apiUrl` to an absolute URL if the API lives on another host.
 */
export const environment = {
  production: true,
  apiUrl: '/api',
  // Cambiar cuando el dominio real esté dado de alta: el mismo build sirve en ambos hosts.
  appUrl: 'https://app.com',
  dashboardUrl: 'https://dashboard.app.com',
} as const;
