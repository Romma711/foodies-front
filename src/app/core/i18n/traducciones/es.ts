/**
 * Spanish texts: the source and the fallback of every other language. Keys are grouped by the
 * feature folder that uses them (`<area>.<screen>.<text>`); `{name}` marks a value filled in at
 * runtime. Adding a key here without adding it to `en.ts` and `pt.ts` fails the parity test.
 */
export const ES = {
  // Language selector
  'idioma.etiqueta': 'Idioma',
  // Route titles (tab)
  'titulo.inicio': 'Foodies',
  'titulo.restaurantes': 'Restaurantes | Foodies',
  'titulo.restaurante': 'Restaurante | Foodies',
  'titulo.misReservas': 'Mis reservas | Foodies',
  'titulo.miPerfil': 'Mi perfil | Foodies',
  'titulo.misResenas': 'Mis reseñas | Foodies',
  'titulo.admin.dashboard': 'Dashboard | Admin Foodies',
  'titulo.admin.aceptar': 'Aceptar restaurantes | Admin Foodies',
  'titulo.admin.solicitud': 'Solicitud de restaurante | Admin Foodies',
  'titulo.admin.moderacion': 'Moderación | Admin Foodies',
  'titulo.admin.entidades': 'Entidades | Admin Foodies',
  'titulo.panel.resumen': 'Resumen · Foodies',
  'titulo.panel.perfil': 'Perfil · Foodies',
  'titulo.panel.carta': 'Carta · Foodies',
  'titulo.panel.espacios': 'Espacios · Foodies',
  'titulo.panel.horarios': 'Horarios · Foodies',
  'titulo.panel.capacidad': 'Capacidad · Foodies',
  'titulo.panel.fotos': 'Fotos · Foodies',
  'titulo.panel.reservas': 'Reservas · Foodies',
  // App shell, header and footer
  'shell.saltarContenido': 'Saltar al contenido',
  'portal.cliente': 'Cliente',
  'portal.restaurante': 'Restaurante',
  'portal.admin': 'Admin',
  'nav.inicioAria': 'Foodies, ir al inicio',
  'nav.principal': 'Navegación principal',
  'nav.movil': 'Navegación móvil',
  'nav.restaurantes': 'Restaurantes',
  'nav.paraRestaurantes': 'Para restaurantes',
  'nav.crearCuenta': 'Crear cuenta',
  'nav.iniciarSesion': 'Iniciar sesión',
  'nav.cerrarSesion': 'Cerrar sesión',
  'nav.cerrarSesionDe': 'Cerrar sesión de {portal}',
  'nav.abrirMenu': 'Abrir menú',
  'nav.cerrarMenu': 'Cerrar menú',
  'nav.miPerfil': 'Mi perfil',
  'nav.misResenas': 'Mis reseñas',
  'nav.misReservas': 'Mis reservas',
  'footer.lema':
    'Reseñas honestas, experiencias memorables. Descubrí dónde comer y compartí lo que viviste.',
  'footer.enlaces': 'Enlaces del pie de página',
  'footer.derechos': '© 2026 Foodies. Todos los derechos reservados.',
  'footer.hecho': 'Hecho con hambre y buenas historias.',
  // Shared UI
  'comun.volver': 'Volver',
  'comun.volverAlInicio': 'Volver al inicio',
  'comun.cerrarNotificacion': 'Cerrar notificación',
  'comun.errorConexion': 'No se pudo conectar con el servidor.',
};

export type Clave = keyof typeof ES;

/** A language other than Spanish may lack a key: it falls back to Spanish at runtime. */
export type Traducciones = Partial<Record<Clave, string>>;
