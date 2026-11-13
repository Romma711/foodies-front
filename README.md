# Foodies · Front

**Español** · [English](README.en.md)

Front-end de **Foodies**, una plataforma de reservas y reseñas de restaurantes de Mar del Plata. Clientes, restaurantes y administradores usan la misma aplicación, cada uno en su propio portal y con su propia sesión.

Hecho con **Angular 22** sin zone.js, **signals**, **Signal Forms** y **Tailwind CSS v4**, y probado con **442 tests** en Vitest.

[![CI](https://github.com/Romma711/foodies-front/actions/workflows/ci.yml/badge.svg)](https://github.com/Romma711/foodies-front/actions/workflows/ci.yml)

## Qué hace

| Rol | Qué puede hacer |
|---|---|
| Visitante | Ver el catálogo en lista o en mapa, filtrar por especialidad, ver fotos, carta y reseñas |
| Cliente | Reservar mesa, modificar o cancelar la reserva, escribir y editar reseñas, gestionar su perfil |
| Restaurante | Aceptar o cancelar reservas, definir cupos especiales por fecha, subir fotos y carta |
| Administrador | Aprobar restaurantes, moderar reseñas, aplicar strikes y ver métricas en un dashboard propio |

El back-end es una API REST en Spring Boot: [Romma711/foodies](https://github.com/Romma711/foodies).

## Stack

| Área | Tecnología |
|---|---|
| Framework | Angular 22.2, componentes standalone, sin zone.js |
| Estado | Signals (`signal`, `computed`, `linkedSignal`) en servicios |
| Formularios | Signal Forms (`@angular/forms/signals`) |
| Estilos | Tailwind CSS 4.3 con tokens en `@theme` |
| Mapas y gráficos | Leaflet 1.9 y Chart.js 4.6 |
| Tests | Vitest 5 + jsdom, TestBed, `HttpTestingController`, axe-core |
| Calidad | Prettier y GitHub Actions (formato, tests y build en cada push y PR) |

## Cómo correrlo

Necesitás **Node 24** y el back-end corriendo en `http://localhost:8080`.

```bash
npm ci
npm start
```

Abrí `http://localhost:4200`. El servidor de desarrollo reenvía `/api` al back-end (ver `proxy.conf.json`).

El panel de administración se sirve en otro host: `http://dashboard.localhost:4200`.

Para tener datos de prueba, corré el seed del back-end (`node docs/db/seed-demo.mjs` en el repo `foodies`). Las cuentas de demo y el recorrido completo están en [DEMO.md](DEMO.md).

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo con recarga en caliente |
| `npm test` | Tests en modo watch |
| `npm run test:ci` | Toda la suite una vez, como en CI |
| `npm run format:check` | Revisa el formato con Prettier |
| `npm run build` | Build de producción en `dist/` |

## Arquitectura

### Estructura por features

```text
src/app/
├─ core/        sesión, interceptor, guards y configuración de hosts
├─ features/    reservas, resenas, mapa, perfil, admin
├─ pages/       home, login, registro, catálogo y panel del restaurante
├─ shared/      a11y, gráficos, toast: lo que usan dos o más features
└─ components/  header y footer
```

Cada feature agrupa sus componentes, servicios, modelos, utilidades y tests. Un cambio en reservas vive en una sola carpeta, y la estructura muestra de qué trata el sistema antes que el framework que usa.

`shared/` solo recibe código que ya usan dos módulos. El toast y la fábrica de gráficos nacieron en reseñas y se movieron cuando el panel de administración los necesitó.

Las pantallas más antiguas (catálogo, login y panel del restaurante) siguen en `pages/`. Moverlas a `features/` es la próxima mejora de estructura.

### Estado con signals

Cada servicio guarda su estado en signals privados y los expone en solo lectura:

```ts
private readonly _resenas = signal<ResenaListDTO[]>([]);
readonly resenas = this._resenas.asReadonly();
readonly totalResenas = computed(() => this._resenas().length);
```

Los valores derivados, como el promedio o la distribución de estrellas, se calculan con `computed` y nunca se guardan dos veces. Para el tamaño de esta app, este patrón cubre lo mismo que un store global con menos piezas.

Sin zone.js, Angular vuelve a renderizar solo lo que depende de un signal que cambió.

### Formularios

Las reglas de validación se escriben una vez como schema de Signal Forms y las comparten varios formularios. Por ejemplo, `reglasReserva` valida tanto la creación como la modificación de una reserva. El front valida para responder al instante; el back-end vuelve a validar todo.

### Autenticación por rol

- Cada rol guarda su token en su propia clave (`foodies.token.CLIENTE`, `.RESTAURANTE`, `.ADMIN`), así que las sesiones no se pisan.
- El servicio indica con qué rol viaja cada pedido: `http.get(url, { context: withRole('CLIENTE') })`.
- El interceptor agrega el token solo si el pedido trae un rol. Ante un 401 cierra únicamente esa sesión.
- Los guards son funcionales: `roleGuard(rol)` redirige al login de ese rol y vuelve a la página pedida.

### Dos hosts, un build

Al arrancar, la app mira el hostname. Si empieza con `dashboard.` carga las rutas de administración; si no, las públicas. Así el panel queda en otro origen, sin header ni footer públicos, y se mantiene un solo proyecto y un solo deploy.

### Rutas

Todas las rutas usan carga diferida (`loadComponent` o `loadChildren`) y tienen su propio `title`. El bundle inicial tiene un presupuesto: el build avisa en 500 kB y falla en 1 MB.

## Estilos

Tailwind CSS v4 lee los tokens del bloque `@theme` de `src/styles.css` y genera las clases (`bg-brand-500`, `text-ink-900`). No hay archivo de configuración: los tokens son CSS. El estilo queda en el template, junto al componente.

## Accesibilidad

El objetivo es WCAG 2.2 AA:

- foco visible en todos los controles;
- regiones `role="status"` y `role="alert"` que anuncian reservas enviadas, cambios guardados y errores;
- el foco no se pierde al abrir o cerrar un formulario (helper `enfocarTrasRender`);
- enlace para saltar al contenido, y Escape para cerrar el menú móvil;
- contraste medido en cada token de color.

axe-core no reporta violaciones en las páginas del cliente, en escritorio ni en celular.

## Tests

| Tipo | Archivos | Qué prueban |
|---|---|---|
| Componentes (TestBed) | 64 | Render, interacción y DOM resultante |
| Servicios (`HttpTestingController`) | 26 | URL, método, cuerpo y rol de cada pedido |
| Accesibilidad (axe-core) | 4 | Violaciones WCAG dentro de los tests |

Son 442 tests en 70 archivos, y la suite completa tarda unos 25 segundos. Los nombres de los tests están en español y describen la regla que prueban. Las dependencias que jsdom no puede ejecutar, como el canvas de Chart.js, entran por un `InjectionToken` y en los tests se reemplazan por dobles.

## Equipo

- Juan Estavillo
- Ramiro Sacchetta
- Andrés Roma

Trabajo final de Programación, UTN FRMDP, 2026.
