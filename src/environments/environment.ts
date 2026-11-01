export const environment = {
  production: false,
  apiUrl: '/api',
  /** Host de la app pública. El dashboard vive en otro host: ver `dashboardUrl`. */
  appUrl: 'http://localhost:4200',
  /**
   * Subdominio del panel de restaurante y admin. En desarrollo, `*.localhost` resuelve a
   * 127.0.0.1 en los navegadores modernos, así que funciona con el mismo `ng serve`.
   */
  dashboardUrl: 'http://dashboard.localhost:4200',
} as const;
