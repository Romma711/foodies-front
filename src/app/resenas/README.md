# Módulo de Reseñas — Foodies (Frontend)

Documentación del módulo de reseñas del TFI de Programación IV. Resume qué se construyó en los
Sprints 1 a 5, qué decisiones se tomaron y qué queda abierto para planificar los próximos sprints.

- **Responsable del frontend del módulo:** Juan Estavillo
- **Backend (Spring Boot, JWT, Reservas):** Andrés Roma y Ramiro Sacchetta
- **Entrega:** 2 de noviembre de 2026

---

## 1. Resumen en una línea por sprint

| Sprint | Objetivo                                                     | Estado | Commits principales             |
| ------ | ------------------------------------------------------------ | ------ | ------------------------------- |
| 1      | Interfaces, servicio HTTP y Tailwind                         | ✅     | `fc675a3`, `28c60d4`            |
| 2      | Listado y cards responsive (`StarRating`, `ResenaCard`)      | ✅     | `78a3c1b`, `b530497`, `818c98d` |
| 3      | Formulario de creación y edición con validaciones            | ✅     | `d037c46`, `083ca08`            |
| 4      | Gráfico con Chart.js y protección de UI por roles            | ✅     | `d2dbfe6`, `b5b73ce`            |
| 5      | Integración en la página del restaurante, skeletons y toasts | ✅     | `602a6fd`, `609c4b7`            |
| 10     | Ordenar y filtrar reseñas por calificación                   | ✅     | `ebc62b7`                       |

Los Sprints 6 a 9 (panel de administración) están documentados en `features/admin/README.md`.

Estado de calidad al cierre del Sprint 5: **132 tests en verde** (Vitest) y build de producción sin
errores ni warnings.

---

## 2. Stack y convenciones

- **Angular 22**: componentes standalone, control flow nativo (`@if`, `@for`), `OnPush` por
  defecto, `inject()`, `input()` / `output()`.
- **Estado con Signals**: `signal`, `computed`, `linkedSignal`, `effect`, `afterRenderEffect`.
- **Formularios**: Signal Forms (`@angular/forms/signals`) con validación por schema.
- **Estilos**: Tailwind CSS **v4** (se decidió mantener v4 en lugar de v3 porque el proyecto ya lo
  usaba con tokens en `@theme` dentro de `src/styles.css`; bajar a v3 afectaba los estilos de todo
  el equipo). Estética tipo WOKI: mucho espacio en blanco, `rounded-2xl`, sombras suaves.
- **Gráficos**: Chart.js 4.6.1.
- **Tests**: Vitest + jsdom vía `ng test`.
- **Git**: Conventional Commits, un commit por unidad de trabajo, siempre agregando rutas
  explícitas (nunca `git add .`).

---

## 3. Arquitectura del módulo

```
features/resenas/
├── models/                      # DTOs espejo del backend + DistribucionCalificacion
├── services/
│   └── resena.service.ts        # HTTP + estado global de reseñas (signals)
├── components/
│   ├── star-rating/             # Estrellas: modo lectura y modo interactivo
│   ├── resena-card/             # Card de una reseña (editar / eliminar con confirmación)
│   ├── resena-form/             # Formulario de creación y edición
│   ├── rating-distribution/     # Gráfico de barras (Chart.js) + tabla accesible
│   └── restaurante-resenas/     # Bloque completo embebible en la página del restaurante
└── pages/
    └── resena-list/             # Ruta legacy /resenas/:id (wrapper del bloque)

shared/                          # Piezas genéricas que también usa el panel de admin
├── charts/bar-chart-factory.ts  # Token BAR_CHART_FACTORY (Chart.js de barras)
└── toast/                       # ToastService (provisto por componente) + ToastOutlet
```

### Flujo de datos

```
RestauranteDetail (página de restaurante)
  └── RestauranteResenas  ── inject ──► ResenaService ──HTTP──► /api/resenas
        ├── StarRating + RatingDistribution   (resumen: promedio y distribución)
        ├── ResenaForm                        (crear / editar)
        ├── ResenaCard × N                    (listado)
        └── ToastOutlet  ── inject ──► ToastService (scoped al bloque)
```

### Endpoints consumidos

| Método | Endpoint                           | Uso                              | Token           |
| ------ | ---------------------------------- | -------------------------------- | --------------- |
| GET    | `/api/resenas?id={restauranteId}`  | Listado público                  | —               |
| GET    | `/api/resenas/usuario/{usuarioId}` | Saber cuáles reseñas son propias | CLIENTE         |
| GET    | `/api/resenas/{id}`                | Detalle                          | CLIENTE         |
| POST   | `/api/resenas`                     | Crear                            | CLIENTE         |
| PUT    | `/api/resenas/{id}`                | Editar (solo dueño o admin)      | CLIENTE         |
| DELETE | `/api/resenas/{id}`                | Eliminar (dueño o admin)         | CLIENTE o ADMIN |

El backend responde `204` cuando una lista está vacía; el servicio lo normaliza a `[]`.

---

## 4. Qué se hizo en cada sprint

### Sprint 1 — Base de datos y servicio

- DTOs tipados (`ResenaListDTO`, `ResenaDetailDTO`, `ResenaRequestDTO`, `ResenaPatchDTO`) con barrel
  `models/index.ts`.
- `ResenaService` con `@Service()`: signals privadas expuestas con `asReadonly()`, `computed` para
  total y promedio, separación entre error de lectura (`error`) y de escritura (`mutationError`), y
  traducción de errores HTTP a mensajes en español.

### Sprint 2 — Listado y cards

- `StarRating`: modo lectura con medias estrellas (`role="img"` + `aria-label`) y modo interactivo
  con radios nativos dentro de un `radiogroup` (navegable con teclado, tamaño táctil ≥ 24 px).
- `ResenaCard`: avatar con iniciales y color estable por nombre, estrellas, comentario con
  `break-words` y `whitespace-pre-line`. Se simplificó al estilo WOKI: sin ID interno ni nota
  duplicada, `shadow-sm`.

### Sprint 3 — Formulario de creación y edición

- `ResenaForm` con Signal Forms: calificación de 1 a 5, comentario obligatorio de 10 a 255
  caracteres, contador de caracteres restantes, errores accesibles (`aria-invalid`,
  `aria-describedby`).
- **Edición inline**: el mismo formulario precarga la reseña (`linkedSignal`) y guarda con `PUT`.
- Como `ResenaListDTO` no trae el id del autor, el servicio carga `misResenaIds` desde
  `/resenas/usuario/{id del JWT}` para saber qué reseñas puede editar el cliente.
- Si el cliente ya reseñó el restaurante, se oculta "Escribir reseña" (el backend rechaza duplicados).

### Sprint 4 — Estadísticas y roles

- **Gráfico de distribución** (`RatingDistribution`): barras horizontales de 5★ a 1★ con Chart.js.
  - Se registran solo las piezas de barras para no inflar el bundle; Chart.js queda en el chunk
    lazy de reseñas (≈ 55 kB gzip), no en el bundle inicial.
  - El gráfico se crea mediante el token `BAR_CHART_FACTORY` para poder testearlo sin canvas real.
  - El canvas está oculto a lectores de pantalla y los mismos datos se exponen en una tabla
    `sr-only`.
- **Acciones por rol**:

  | Rol       | Puede                                                |
  | --------- | ---------------------------------------------------- |
  | Visitante | Leer reseñas                                         |
  | Cliente   | Crear una reseña; editar y eliminar solo las propias |
  | Admin     | Eliminar cualquier reseña (moderación)               |
  - Eliminar pide confirmación dentro de la card y mueve el foco a "Cancelar".
  - La ruta de reseñas **no** lleva guard porque la lectura es pública; el `roleGuard` existente
    queda para rutas privadas. La autorización real la hace el backend (403 si no corresponde).

### Sprint 5 — Integración y pulido

- **Reseñas conectadas al restaurante**: se extrajo `RestauranteResenas`, que se embebe al final de
  `/restaurantes/:id`. El botón "Ver reseñas" hace scroll a la sección. `/resenas/:id` redirige al
  restaurante.
- **Skeleton loaders**: tres cards de esqueleto mientras carga, anunciadas como "Cargando reseñas…"
  y con animación desactivada si el usuario prefiere menos movimiento (`motion-safe`).
- **Toasts**: reemplazan los banners fijos. Éxito 4 s, error 6 s, cierre manual. Los éxitos se
  anuncian con `role="status"` y los errores con `role="alert"`.

---

### Sprint 10 — Ordenar y filtrar

- Filtros por calificación ("Todas", 5★ … 1★) con la cantidad de reseñas de cada uno; el filtro
  activo se marca con `aria-pressed`.
- Orden "Más recientes" (por defecto), "Mejor puntuación" y "Peor puntuación" con un `<select>`
  nativo. Como las reseñas no tienen fecha, "más recientes" usa el id autoincremental.
- Un texto `aria-live` anuncia "Mostrando X de Y reseñas"; si un filtro no tiene resultados se
  ofrece "Ver todas".
- La lógica vive en `utils/ordenar-resenas.ts` como función pura y testeada.

## 5. Decisiones técnicas importantes

| Decisión                                                   | Motivo                                                                                   |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Mantener Tailwind v4                                       | El proyecto ya lo usaba; bajar a v3 rompía estilos del resto del equipo                  |
| Edición inline en el restaurante (no página "Mis reseñas") | El DTO de lista no trae el nombre del restaurante; inline no requiere cambios de backend |
| `misResenaIds` en el servicio                              | El DTO de lista no trae el autor; se cruza con el endpoint por usuario                   |
| `BAR_CHART_FACTORY` inyectable                             | jsdom no tiene contexto 2D; permite testear el componente con un fake                    |
| `ToastService` provisto por componente                     | Cada bloque maneja su cola y sus timers mueren con él                                    |
| Sin guard en la ruta de reseñas                            | La lectura es pública; los roles controlan acciones, no la ruta                          |

---

## 6. Cómo correrlo y probarlo

```bash
cd foodies-front
npm install
ng serve -o          # http://localhost:4200 (proxy /api → http://localhost:8080)
npx ng test --watch=false
```

- Las reseñas se ven en `/restaurantes/{id}` (por ejemplo `/restaurantes/5`).
- Cuentas de prueba: ver la sección "Datos de Prueba" del README del backend (`foodies-repo`).
- Prueba manual recomendada: visitante (solo lectura) → cliente (crear, editar, eliminar la
  propia) → admin (eliminar cualquiera).

---

## 7. Pendientes conocidos

### Para el merge del equipo (27/10/2026)

La integración con la página del restaurante está aplicada pero **sin commitear**, porque esos
archivos compartidos tienen trabajo de reservas de otros integrantes también sin commitear:

- `pages/restaurante/restaurante-detail/*`: `<app-restaurante-resenas>`, botón "Ver reseñas" y
  stub del bloque en el spec.
- `app.routes.ts`: redirect de `resenas/:restauranteId` a `restaurantes/:restauranteId`.
- `components/header/header.html` y `components/footer/footer.html`: se quitó el link fijo a
  `/resenas/5`.

Después del merge, verificar que estos cambios sobrevivan. Con el redirect commiteado se puede
borrar `pages/resena-list`.

### Limitaciones de datos (backend)

- `ResenaListDTO` no incluye `usuarioId` ni `nombreRestaurant` (obliga a una segunda llamada para
  saber qué reseñas son propias).
- Algunas reseñas llegan con `nombreUsuario` vacío y se muestran como "Anónimo".
- No hay paginación: el listado trae todas las reseñas del restaurante.

### Sin verificar manualmente

- Toasts en pantalla real (solo cubiertos por tests).

---

## 8. Candidatos para los próximos 5 sprints

Ideas para analizar y priorizar; no son compromisos. Se marca si requieren cambios de backend.

| Candidato                                                               | Valor             | Backend                                         |
| ----------------------------------------------------------------------- | ----------------- | ----------------------------------------------- |
| Página "Mis reseñas" del cliente con link a cada restaurante            | Alto              | Sí (agregar `nombreRestaurant` al DTO de lista) |
| Paginación o "cargar más"                                               | Medio             | Sí                                              |
| Respuesta del restaurante a una reseña (rol RESTAURANTE)                | Alto              | Sí                                              |
| Promedio y cantidad de reseñas en las cards del listado de restaurantes | Alto              | Opcional                                        |
| Fecha de publicación y "editada" en cada reseña                         | Medio             | Sí                                              |
| Auditoría de accesibilidad con axe y tests e2e (Playwright/Cypress)     | Alto para la nota | No                                              |
| Usar los toasts de `shared/toast` también en Reservas                   | Medio             | No                                              |
| Moderación del admin desde su panel (listado de reseñas reportadas)     | Medio             | Sí                                              |
| Estado optimista al crear/editar/eliminar con rollback ante error       | Medio             | No                                              |
