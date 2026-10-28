# Panel de Administración — Foodies

Documentación de la Fase 2 del TFI (Sprints 6 a 9): métricas en el backend, guard y layout del
panel, dashboard con Chart.js y moderación de reseñas. Al final hay una lista de **puntos a revisar**
antes de dar la fase por cerrada.

---

## 1. Resumen por sprint

| Sprint | Objetivo                                                                    | Repo                                                           | Commits                          |
| ------ | --------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------- |
| 6      | `MetricasAdminDTO`, `AdminService`, `AdminController` (solo ROLE_ADMIN)     | backend, rama `feature/admin-metricas`                         | `824ca5d`, `19f87c0`             |
| 7      | `adminGuard` + `AdminLayout` con sidebar                                    | frontend                                                       | `c4a4ead`                        |
| 8      | Dashboard con Chart.js                                                      | frontend                                                       | `bf0b411`, `af17b8b`             |
| 9      | Moderación: reseñas recientes + borrado rápido                              | backend + frontend                                             | `1e49c85` · `698282e`, `ae6416b` |
| 19     | Fase 3: Solicitudes (aprobar/rechazar) y Gestión de Entidades (baja lógica) | backend + frontend, rama `feature/admin-solicitudes-entidades` | ver `git log`                    |

Calidad al cierre: **25 tests de backend** (JUnit + H2) y **175 tests de frontend** (Vitest) en
verde; build de producción sin errores.

---

## 2. Backend (`foodies-repo`, paquete `ADMIN`)

No se modificó ningún controlador existente. Todo es nuevo salvo un campo en `Usuario`.

| Archivo                     | Rol                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| `AdminController`           | `GET /api/admin/metricas` y `GET /api/admin/resenas?limite=20`                                   |
| `AdminService`              | Arma el DTO de métricas ("este mes" en hora de Argentina) y acota el límite de moderación a 1–50 |
| `AdminMetricasRepository`   | 4 consultas JPQL documentadas con JavaDoc                                                        |
| `AdminModeracionRepository` | Reseñas recientes con autor y restaurante en una fila plana                                      |
| `dtos/*`                    | Records: `MetricasAdminDTO`, rankings y `ResenaModeracionDTO` (sin emails)                       |
| `Usuario.fechaRegistro`     | `@CreationTimestamp`, columna `fecha_registro` nullable                                          |

**Métricas**

- Top 5 restaurantes **aprobados** con mejor promedio; desempata quien tiene más reseñas.
- Top 5 restaurantes con más reservas, **sin contar las canceladas**.
- Top 5 usuarios con más reseñas.
- Usuarios registrados en el mes en curso: rango `[día 1, día 1 del mes siguiente)`.

**Seguridad:** `/api/admin/**` ya exige `ROLE_ADMIN` en `SecurityConfig` y el controlador suma
`@PreAuthorize("hasRole('ADMIN')")`. Tests de punta a punta: admin 200, cliente 403, sin token 401.

---

## 3. Frontend (`features/admin`)

```
features/admin/
├── admin.routes.ts              # Hijas lazy de /admin (dashboard y moderación)
├── guards/admin.guard.ts        # Token vigente + claim de rol ADMIN; si no, limpia y va al login con returnUrl
├── layout/admin-layout.ts       # Sidebar WOKI, menú mobile, cerrar sesión
├── components/ranking-chart/    # Barras horizontales/verticales o torta (Chart.js), tabla o leyenda accesible, estado vacío
├── services/
│   ├── admin-metricas.service.ts
│   └── admin-moderacion.service.ts
├── models/
└── pages/
    ├── dashboard-admin/         # KPI de usuarios nuevos + 3 rankings
    └── moderacion-resenas/      # Tabla de reseñas recientes con confirmación inline
```

Piezas compartidas con reseñas, movidas a `shared/`: `charts/bar-chart-factory.ts` y `toast/`.

---

## 4. Para revisar esta noche

### Requiere acción del equipo

1. **Borrado como admin depende de cambios sin commitear.** La moderación usa
   `DELETE /api/resenas/{id}`. El permiso de admin (`esAdmin`) solo existe en cambios **sin
   commitear** de `ResenaController` / `ResenaService`; la versión commiteada no lo tiene. Si en el
   merge se pierde, la moderación va a recibir 403.
2. **Rutas sin commitear (`app.routes.ts`).** `admin/login` va antes que `admin`, y `admin` usa
   `loadChildren` con `adminGuard`. El `AdminHome` viejo ya no se usa. Junto con la integración de
   reseñas en `restaurante-detail`, header y footer, son los cambios a cuidar en el merge.
3. **Rama del backend.** Todo el backend nuevo está en `feature/admin-metricas` (los 10 archivos
   sin commitear de los compañeros siguen sin tocar). Decidir cuándo integrarla a `master`.

### Para probar a mano

4. Borrar una reseña de prueba desde `/admin/moderacion` (no lo probé contra el backend real para
   no borrar datos).
5. Registrar un usuario nuevo y ver que "Usuarios nuevos" del dashboard pase de 0 a 1 (los usuarios
   anteriores tienen `fecha_registro` en `NULL` y no cuentan).
6. Entrar a `/admin/moderacion` con sesión de cliente: debe redirigir a
   `/admin/login?returnUrl=%2Fadmin%2Fmoderacion` y, después de ingresar como admin, volver a
   `/admin/moderacion`.

### Decisiones tomadas sin consulta (revisar si están bien)

7. **Sprint 10 elegido por mí:** "Ordenar y filtrar reseñas" (alto valor, solo frontend, sin
   dependencias nuevas).
8. **Orden por defecto "Más recientes".** Antes las reseñas salían en el orden del backend (id
   ascendente); ahora la más nueva va primero. Se ajustó un test que dependía del orden viejo.
9. **"Recientes" = id descendente.** `Resena` no tiene fecha; agregar `fechaCreacion` sería otro
   cambio de esquema.
10. **Usuarios sin nombre se muestran como "Anónimo"** en dashboard y moderación, igual que en las
    cards de reseñas.

### Riesgo

- Item 1 (esquema): columna nueva `usuario.fecha_registro`, nullable, sin pérdida de datos.
- Item 2 (permisos): guard nuevo y endpoints solo ADMIN; el backend autoriza cada llamada.
- No se corrió un revisor independiente.

---

## Fase 3 · Sprint 19: Solicitudes y Gestión de Entidades

- **Solicitudes** (`/admin/solicitudes`): restaurantes en estado `PENDIENTE` con los datos de contacto
  del encargado. _Aprobar_ lo publica y le da `ROLE_ENCARGADO`; _Rechazar_ pide confirmación.
  Servicio: `AdminSolicitudesService` (`GET /api/admin/restaurantes/pendientes`,
  `PUT .../{id}/aprobar|rechazar`).
- **Entidades** (`/admin/entidades`): pestañas Clientes / Restaurantes (patrón WAI-ARIA tabs, se
  recorren con las flechas) con strikes, estado y un interruptor `role="switch"` de baja lógica.
  Servicio: `AdminEntidadesService` (`GET /api/admin/entidades/*`, `PATCH .../{id}/activo`).
- Baja lógica: un cliente dado de baja recibe 403 al loguearse (el login muestra el mensaje del
  backend) y pierde el acceso con tokens anteriores; un restaurante dado de baja deja de aparecer en
  el catálogo público. Nada se borra y todo se puede reactivar.
- Los errores de las acciones se muestran con `mensajeErrorAdmin`, que usa el `mensaje` del backend
  en los 400 (por ejemplo, "No se puede dar de baja a un administrador").

## Fase 3 · Sprint 20: Strikes con email de aviso

- En **Entidades**, cada fila tiene **+ Strike**, que abre `StrikeModal` (`<dialog>` nativo,
  presentacional): motivo obligatorio de 5 a 255 caracteres, contador y aviso cuando el strike llega
  al límite. La página llama a `AdminEntidadesService.aplicarStrike` (`POST
/api/admin/{usuarios|restaurantes}/{id}/strikes`) y el backend envía el email.
- Si el email no sale (por ejemplo, sin credenciales de Mailtrap), el strike igual se guarda y el
  toast lo aclara: "…, pero no se pudo enviar el email de aviso."
- Con 3 strikes o más la fila muestra el badge **"Sugerir penalización / dar de baja"**; la baja
  sigue siendo una decisión del admin con el interruptor de la misma fila.
